// src/app/api/gemini/route.js
// Gemini TEXT-only endpoint

export async function POST(req) {
  try {
    const { prompt = '', maxTokens = 800 } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    if (!String(prompt).trim()) {
      return Response.json({ error: 'Provide a prompt' }, { status: 400 });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: String(prompt) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    const rawText = await res.text();

    if (!res.ok) {
      console.error('Gemini API error:', rawText);
      return Response.json({ error: rawText }, { status: res.status });
    }

    const data = JSON.parse(rawText);

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text)
        .filter(Boolean)
        .join('\n') || '';

    return Response.json({ success: true, text });
  } catch (e) {
    console.error('Gemini route error:', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}