import { NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';

export async function POST(req) {
  try {
    // Extract the base64 image and its MIME type from the request body
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();

    // Reject requests that arrive without image data
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Ensure the HuggingFace API key is configured in environment variables
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing HUGGINGFACE_API_KEY' }, { status: 500 });
    }

    const client = new InferenceClient(apiKey);

    // Send the image to Qwen2.5-VL, a vision-language model hosted via Hyperbolic.
    // The prompt steers the model to focus specifically on art-relevant attributes rather than a generic image description.
    const response = await client.chatCompletion({
      model: 'Qwen/Qwen2.5-VL-7B-Instruct',
      provider: 'hyperbolic',
      messages: [
        {
          role: 'user',
          content: [
            {
              // Pass the image as a base64 data URL
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              // Constrain the output to art-specific attributes for consistent parsing downstream
              type: 'text',
              text: 'Describe this image concisely. Focus on: art style (abstract, portrait, landscape, realism, impressionism, expressionism), medium (oil, watercolor, charcoal, acrylic, digital, pencil, ink), dominant colors, mood (dark, vibrant, calm, dramatic, moody), and subject matter. One short paragraph only.',
            },
          ],
        },
      ],
      max_tokens: 200, // Keep the description short and focused
    });

    // Pull the generated text out of the standard OpenAI-compatible response shape
    const caption = response.choices?.[0]?.message?.content || '';

    if (!caption) {
      return NextResponse.json({ error: 'No caption generated' }, { status: 500 });
    }

    console.log('Caption:', caption);

    // Common words that add no analytical value, filtered out before keyword extraction
    const stopWords = new Set([
      'a','an','the','of','in','on','at','with','and','or',
      'is','are','was','be','to','it','its','by','as','for',
      'that','this','from','image','depicts','shows','painting',
      'artwork','piece','features','overall','scene',
    ]);

    // Tokenise the caption into lowercase alpha-only words, stripping stop words and single/double character tokens that are rarely meaningful
    const keywords = caption
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // Build a structured analysis object by scanning the keyword list for known art-domain terms. Falls back to an empty string if a category isn't detected.
    const analysis = {
      description: caption,
      keywords,
      subjects: keywords.slice(0, 5), // First 5 keywords are typically the most prominent subjects

      // Match against known art style vocabulary
      style: keywords.find((k) =>
        ['abstract','portrait','landscape','realism','impressionism',
         'expressionism','surrealism','minimalist','geometric'].includes(k)
      ) || '',

      // Match against known art medium vocabulary
      medium: keywords.find((k) =>
        ['oil','watercolour','watercolor','charcoal','acrylic',
         'digital','pencil','ink','pastel','gouache'].includes(k)
      ) || '',

      // Match against mood descriptors
      mood: keywords.find((k) =>
        ['dark','bright','vibrant','calm','dramatic','moody',
         'vivid','serene','energetic','melancholic'].includes(k)
      ) || '',

      // Collect all colour mentions (can be multiple, hence filter not find)
      colors: keywords.filter((k) =>
        ['red','blue','green','yellow','orange','purple','pink',
         'black','white','brown','grey','gray','gold','teal'].includes(k)
      ),
    };

    return NextResponse.json({ success: true, analysis });

  } catch (e) {
    // Catch unexpected errors such as network failures or malformed model responses
    console.error('HuggingFace vision route error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}