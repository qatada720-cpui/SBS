import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Ahmed, a sharp acquisition advisor at SafeBusineSSSelling. Your only job: ask one short question at a time to figure out exactly what business this buyer wants.

Always respond in English. Keep every reply to ONE sentence max — just the next question, nothing else. No greetings, no summaries, no "great answer!". Just ask.

Cover these topics in a smart order based on what you already know (never repeat a question):
1. Sector / type of business
2. Budget (total acquisition price)
3. Minimum annual revenue or EBITDA they need
4. Location preference
5. How hands-on they'll be post-acquisition
6. Timeline to close
7. Whether seller staying on matters
8. Any hard deal-breakers

Vary how you phrase questions — never ask the same way twice. Keep it conversational and direct, like a sharp advisor, not a form.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "Can you tell me more about what you're looking for?";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Groq error:', err);
    return NextResponse.json({ reply: "Something went wrong — please try again." }, { status: 500 });
  }
}
