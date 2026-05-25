import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Step 1: Extract structured buyer profile from conversation
    const profileCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Extract a structured buyer profile from this conversation. Return ONLY valid JSON, nothing else. Be precise — if something was not mentioned, use null.

{
  "sectors": [],          // REQUIRED: list of sectors the buyer explicitly wants, e.g. ["SaaS", "E-commerce"]. Empty array [] means ANY sector.
  "sectors_excluded": [], // sectors the buyer explicitly does NOT want
  "budget_max": null,     // maximum acquisition price in euros (number), null if not mentioned
  "budget_min": null,     // minimum acquisition price in euros (number), null if not mentioned
  "revenue_min": null,    // minimum annual revenue in euros (number), null if not mentioned
  "ebitda_min": null,     // minimum annual EBITDA in euros (number), null if not mentioned
  "location": null,       // preferred country or region as a string, null if flexible
  "remote_ok": true,      // true if location-independent/remote is acceptable
  "involvement": null,    // "operator", "strategic", or "investor" — how hands-on they'll be
  "timeline_months": null,// max months to close, null if flexible
  "seller_staying": null, // true if they need the seller to stay on post-sale
  "dealbreakers": [],     // list of explicit deal-breakers
  "experience": null      // "first-time" or "experienced"
}`,
        },
        ...messages,
        {
          role: 'user',
          content: 'Extract the buyer profile from this conversation as JSON.',
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    let profile: Record<string, unknown> = {};
    try {
      const raw = profileCompletion.choices[0]?.message?.content ?? '{}';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      profile = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      profile = {};
    }

    // Step 2: Fetch all live verified listings from Supabase
    const { data: allListings } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'live')
      .eq('verified', true);

    if (!allListings || allListings.length === 0) {
      return NextResponse.json({ matches: [], profile });
    }

    // Step 3: Hard pre-filter — eliminate obvious mismatches before AI scoring
    const sectors = (profile.sectors as string[]) ?? [];
    const sectorsExcluded = (profile.sectors_excluded as string[]) ?? [];
    const budgetMax = profile.budget_max as number | null;
    const budgetMin = profile.budget_min as number | null;
    const revenueMin = profile.revenue_min as number | null;
    const ebitdaMin = profile.ebitda_min as number | null;

    const filtered = allListings.filter((l) => {
      // Sector must match if buyer specified sectors
      if (sectors.length > 0) {
        const listingSector = (l.sector ?? '').toLowerCase();
        const sectorMatch = sectors.some((s: string) =>
          listingSector.includes(s.toLowerCase()) || s.toLowerCase().includes(listingSector)
        );
        if (!sectorMatch) return false;
      }

      // Exclude sectors buyer doesn't want
      if (sectorsExcluded.length > 0) {
        const listingSector = (l.sector ?? '').toLowerCase();
        const excluded = sectorsExcluded.some((s: string) =>
          listingSector.includes(s.toLowerCase())
        );
        if (excluded) return false;
      }

      // Budget: asking price must be within buyer's budget
      if (budgetMax != null && l.asking_price > budgetMax * 1.1) return false;
      if (budgetMin != null && l.asking_price < budgetMin * 0.5) return false;

      // Revenue floor
      if (revenueMin != null && l.revenue < revenueMin * 0.8) return false;

      // EBITDA floor
      if (ebitdaMin != null && l.ebitda < ebitdaMin * 0.8) return false;

      return true;
    });

    if (filtered.length === 0) {
      return NextResponse.json({ matches: [], profile });
    }

    // Step 4: AI scoring on the pre-filtered set
    const scoringCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a business acquisition matching engine. Score each listing 0–100 based on fit with the buyer profile.

SCORING RULES — apply strictly:
- Sector match is mandatory. If the sector doesn't match what the buyer wants, score 0. Never recommend a gardening business to someone who wants SaaS.
- Budget fit: if asking_price is within the buyer's budget → up to 30 points.
- Revenue/EBITDA fit: if metrics meet the buyer's minimums → up to 25 points.
- Location fit: if location matches or buyer is flexible → up to 20 points.
- Business model fit (recurring revenue, profitability, growth) → up to 15 points.
- Other factors (deal-breakers avoided, involvement type, etc.) → up to 10 points.

Return ONLY a JSON array, nothing else:
[{"id": "uuid", "fit": 87, "reasons": ["SaaS — matches target sector", "Asking price within budget", "Strong recurring revenue"]}]

Be honest. Only high scores (70+) for genuinely strong matches. Scores below 40 mean it's a poor fit.`,
        },
        {
          role: 'user',
          content: `Buyer profile: ${JSON.stringify(profile)}

Listings to score:
${JSON.stringify(filtered.map((l) => ({
  id: l.id,
  name: l.name,
  sector: l.sector,
  location: l.location,
  revenue: l.revenue,
  ebitda: l.ebitda,
  asking_price: l.asking_price,
  description: l.description,
})))}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    let scores: { id: string; fit: number; reasons: string[] }[] = [];
    try {
      const raw = scoringCompletion.choices[0]?.message?.content ?? '[]';
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      scores = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      scores = [];
    }

    // Merge scores with full listing data, only show fit >= 50
    const matches = scores
      .map((s) => ({
        ...s,
        listing: allListings.find((l) => l.id === s.id),
      }))
      .filter((m) => m.listing && m.fit >= 50)
      .sort((a, b) => b.fit - a.fit);

    return NextResponse.json({ matches, profile });
  } catch (err) {
    console.error('Match error:', err);
    return NextResponse.json({ matches: [], profile: {} }, { status: 500 });
  }
}
