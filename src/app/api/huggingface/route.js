import { NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';

export async function POST(req) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing HUGGINGFACE_API_KEY' }, { status: 500 });
    }

    const client = new InferenceClient(apiKey);

    const response = await client.chatCompletion({
      model: 'Qwen/Qwen2.5-VL-7B-Instruct',
      provider: 'hyperbolic',         // ✅ this provider actually supports this model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: 'Describe this image concisely. Focus on: art style (abstract, portrait, landscape, realism, impressionism, expressionism), medium (oil, watercolor, charcoal, acrylic, digital, pencil, ink), dominant colors, mood (dark, vibrant, calm, dramatic, moody), and subject matter. One short paragraph only.',
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const caption = response.choices?.[0]?.message?.content || '';

    if (!caption) {
      return NextResponse.json({ error: 'No caption generated' }, { status: 500 });
    }

    console.log('Caption:', caption);

    const stopWords = new Set([
      'a','an','the','of','in','on','at','with','and','or',
      'is','are','was','be','to','it','its','by','as','for',
      'that','this','from','image','depicts','shows','painting',
      'artwork','piece','features','overall','scene',
    ]);

    const keywords = caption
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const analysis = {
      description: caption,
      keywords,
      subjects: keywords.slice(0, 5),
      style: keywords.find((k) =>
        ['abstract','portrait','landscape','realism','impressionism',
         'expressionism','surrealism','minimalist','geometric'].includes(k)
      ) || '',
      medium: keywords.find((k) =>
        ['oil','watercolour','watercolor','charcoal','acrylic',
         'digital','pencil','ink','pastel','gouache'].includes(k)
      ) || '',
      mood: keywords.find((k) =>
        ['dark','bright','vibrant','calm','dramatic','moody',
         'vivid','serene','energetic','melancholic'].includes(k)
      ) || '',
      colors: keywords.filter((k) =>
        ['red','blue','green','yellow','orange','purple','pink',
         'black','white','brown','grey','gray','gold','teal'].includes(k)
      ),
    };

    return NextResponse.json({ success: true, analysis });

  } catch (e) {
    console.error('HuggingFace vision route error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}