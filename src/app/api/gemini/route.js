export async function POST(req) {
  try {
    const { prompt } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
        }),
      }
    );

    const text = await res.text();
    if (!res.ok) return Response.json({ error: text }, { status: res.status });

    try {
      return Response.json(JSON.parse(text));
    } catch {
      return Response.json({ error: 'Gemini returned non-JSON', raw: text }, { status: 500 });
    }
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}