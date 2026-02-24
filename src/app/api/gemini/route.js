// src/app/api/gemini/route.js
// Gemini (text + image) endpoint

export async function POST(req) {
  try {
    const body = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const {
      prompt = '',
      image = null,    // base64 string (no data URL prefix)
      mimeType = null, // e.g. "image/jpeg"
      maxTokens = 800,
    } = body || {};

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    const parts = [];

    if (image && mimeType) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: image,
        },
      });
    }

    if (prompt && String(prompt).trim()) {
      parts.push({ text: String(prompt) });
    }

    if (parts.length === 0) {
      return Response.json({ error: 'Provide at least prompt or image' }, { status: 400 });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.1,
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

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return Response.json({ success: true, ...parsed });
    } catch {
      console.error('Gemini did not return valid JSON. Raw text:', text);
      return Response.json({ success: false, error: 'Gemini did not return valid JSON', raw: text }, { status: 500 });
    }
  } catch (e) {
    console.error('Gemini route error:', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}