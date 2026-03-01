export async function POST(req) {
  try {
    // Extract prompt and optional token limit from the request body
    const { prompt = '', maxTokens = 800 } = await req.json();

    // Ensure the Gemini API key is configured in environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }
    
    // Reject empty prompts before making an unnecessary API call
    if (!String(prompt).trim()) {
      return Response.json({ error: 'Provide a prompt' }, { status: 400 });
    }

    // Allow the model to be overridden via env (defaults to gemini-2.5-flash)
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // Call the Gemini generateContent endpoint
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
    
    // Forward any error status from Gemini back to the caller
    if (!res.ok) {
      console.error('Gemini API error:', rawText);
      return Response.json({ error: rawText }, { status: res.status });
    }

    // Extract the generated text from the nested Gemini response structure: data.candidates[0].content.parts[].text
    const data = JSON.parse(rawText);

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text)
        .filter(Boolean)
        .join('\n') || '';

    return Response.json({ success: true, text });
  } catch (e) {
    // Catch unexpected errors (network failures, JSON parse errors, etc.)
    console.error('Gemini route error:', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}