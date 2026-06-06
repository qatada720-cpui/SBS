import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Step 1: Extract structured buyer profile from conversation
    const profileCompletion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Extract a structured buyer profile from this conversation. The conversation may be in Dutch or English — handle both.

Return ONLY valid JSON, nothing else. If something was not mentioned, use null.

Number conversion rules:
- "1 miljoen" or "1 million" = 1000000
- "500k" or "500 duizend" = 500000
- "2,5 miljoen" = 2500000
- "anderhalf miljoen" or "1.5 million" = 1500000

{
  "sectors": [],          // sectors the buyer wants, e.g. ["Logistics", "SaaS"]. Empty array = ANY sector. Map Dutch: logistiek=Logistics, zorg=Healthcare, horeca=Food & Beverage, software=SaaS, webshop=E-commerce
  "sectors_excluded": [], // sectors they do NOT want
  "budget_max": null,     // maximum price in euros as a number
  "budget_min": null,     // minimum price in euros as a number
  "revenue_min": null,    // minimum annual revenue in euros as a number
  "ebitda_min": null,     // minimum annual profit/EBITDA in euros as a number
  "location": null,       // preferred country or city as English string, null if flexible
  "remote_ok": true,      // true if online/remote business is OK
  "involvement": null,    // "operator" (full-time), "strategic" (part-time), or "investor" (passive/hands-off)
  "timeline_months": null,// how many months to close
  "seller_staying": null, // true if they want the seller to stay on
  "dealbreakers": [],     // list of deal-breakers as strings
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

    // Step 2: Fetch all live listings from Supabase
    const { data: allListings } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'live');

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
    const scoringCompletion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a business acquisition matching engine. Score each listing 0–100 based purely on fit with the buyer profile.

CRITICAL INTEGRITY RULE: Premium status, verified status, or any platform feature of a listing must NEVER influence the score. A premium listing with poor fit scores low. A non-premium listing with perfect fit scores high. Scores are 100% based on buyer-listing fit only.

SCORING BREAKDOWN:
- Sector match: mandatory. Wrong sector = 0. Correct sector = up to 35 points.
- Budget fit: asking_price within buyer's budget = up to 25 points.
- Revenue/profitability fit: meets buyer's minimums = up to 20 points.
- Location fit: matches preference or buyer is flexible = up to 15 points.
- Other fit factors (deal-breakers avoided, involvement match) = up to 5 points.

Return ONLY a JSON array, nothing else:
[{"id": "uuid", "fit": 87, "reasons": ["Logistics — matches target sector", "Asking price within budget", "Profitable and growing"]}]

Be honest. 70+ = strong match. 40–69 = partial match. Below 40 = poor fit.`,
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
  // premium and verified intentionally excluded — scores must be purely fit-based
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
      .filter((m) => m.listing && m.fit >= 30)
      .sort((a, b) => b.fit - a.fit);

    return NextResponse.json({ matches, profile });
  } catch (err) {
    console.error('Match error:', err);
    return NextResponse.json({ matches: [], profile: {} }, { status: 500 });
  }
}
