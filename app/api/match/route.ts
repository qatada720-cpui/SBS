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
          content: `Based on this buyer conversation, extract a structured profile as JSON. Return ONLY valid JSON, nothing else.

Fields:
{
  "sectors": ["SaaS", "Logistics"],       // preferred sectors, empty array if any
  "budget_min": 500000,                    // minimum budget in euros, null if unknown
  "budget_max": 3000000,                   // maximum budget in euros, null if unknown
  "location": "Netherlands",              // preferred location, null if any
  "remote_ok": true,                       // whether remote/location-independent is ok
  "ebitda_min": 100000,                    // minimum EBITDA in euros, null if unknown
  "revenue_min": 500000,                   // minimum revenue in euros, null if unknown
  "phased_preferred": true,               // prefers phased ownership handover
  "involvement": "operator",              // "operator", "strategic", or "investor"
  "timeline_months": 6,                   // max months to close, null if flexible
  "experience": "first-time buyer",       // buyer's background
  "dealbreakers": ["no restaurants"]      // list of things to avoid
}`,
        },
        ...messages,
        {
          role: 'user',
          content: 'Extract the buyer profile from this conversation as JSON.',
        },
      ],
      max_tokens: 400,
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

    // Step 2: Fetch live listings from Supabase
    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'live')
      .eq('verified', true);

    if (!listings || listings.length === 0) {
      return NextResponse.json({ matches: [], profile });
    }

    // Step 3: Score each listing against the buyer profile
    const scoringCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a business acquisition matching engine. Given a buyer profile and a list of businesses, score each business from 0-100 based on fit. Return ONLY a JSON array like:
[{"id": "uuid", "fit": 87, "reasons": ["Budget match", "Sector alignment", "Location fit"]}]
Be strict — only high scores for strong matches. Return all listings scored.`,
        },
        {
          role: 'user',
          content: `Buyer profile: ${JSON.stringify(profile)}

Listings to score: ${JSON.stringify(listings.map(l => ({
  id: l.id,
  name: l.name,
  sector: l.sector,
  location: l.location,
  revenue: l.revenue,
  ebitda: l.ebitda,
  asking_price: l.asking_price,
  score: l.score,
})))}`,
        },
      ],
      max_tokens: 800,
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

    // Merge scores with full listing data
    const matches = scores
      .map((s) => ({
        ...s,
        listing: listings.find((l) => l.id === s.id),
      }))
      .filter((m) => m.listing && m.fit >= 40)
      .sort((a, b) => b.fit - a.fit);

    return NextResponse.json({ matches, profile });
  } catch (err) {
    console.error('Match error:', err);
    return NextResponse.json({ matches: [], profile: {} }, { status: 500 });
  }
}
