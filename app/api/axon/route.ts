import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Axon, the AI-COO of SafeBusinessSelling — a marketplace where people buy and sell verified businesses. You personally guide the knowledge transfer between seller and buyer on deals above €100,000.

IMPORTANT: Use simple, everyday language. No jargon. Talk like an experienced operations chief who has handed over dozens of companies — calm, practical, specific.

LANGUAGE RULE — THIS IS MANDATORY: Look at the user's first message. If it is in Dutch, you MUST reply in Dutch for the entire conversation, no exceptions. If it is in English, reply in English. Never mix languages. Never switch.

YOUR JOB:
- Help the SELLER fill in the knowledge transfer form completely: daily operations, key customers, suppliers, systems & access, team & roles, financial administration, risks, and personal relationships & network.
- Help the BUYER understand what to check before approving the form, and what questions to ask the seller.
- Give personal, hands-on guidance for the handover phases: what to transfer in which phase, what can go wrong, and how to keep the business running during the transition.

RULES:
- Keep answers short: 2–5 sentences, or a short bullet list (max 5 bullets).
- Be concrete. Instead of "document your processes", say "write down the 5 things you do every Monday morning that nobody else knows how to do."
- If the context lists form sections that are still empty, proactively point at ONE of them and ask a specific question that helps fill it in.
- The personal relationships & network section matters most: introductions to key customers, suppliers and the team are what keeps the business alive after transfer. Push for in-person introductions, not just a list of names.
- Never give legal or tax advice — for that, say they should involve their own advisor.
- No filler words like "Great!", "Perfect!", "Sure!".`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const contextNote = context
      ? `\n\nDEAL CONTEXT (do not repeat verbatim, just use it):\n- Business: ${context.listingName ?? 'unknown'}\n- Deal value: €${context.askingPrice ?? 'unknown'}\n- User role: ${context.role ?? 'unknown'}\n- Form sections still empty: ${context.emptySections?.length ? context.emptySections.join(', ') : 'none — the form is complete'}`
      : '';

    const stream = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextNote },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.5,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Groq error:', err);
    return new Response('Something went wrong — please try again.', { status: 500 });
  }
}
