// src/app/api/image-embed/route.js
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const MODEL = 'sentence-transformers/clip-ViT-B-32';

function toDataUrl(base64, mimeType) {
  return `data:${mimeType || 'image/jpeg'};base64,${base64}`;
}

async function readPublicImageAsBase64(imageUrl) {
  const safeUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const filePath = path.join(process.cwd(), 'public', safeUrl);

  const file = await fs.readFile(filePath);
  const base64 = file.toString('base64');

  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' :
    'image/jpeg';

  return { base64, mimeType };
}

export async function POST(req) {
  try {
    const { imageBase64, mimeType, imageUrl } = await req.json();

    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) {
      return Response.json({ error: 'Missing HUGGINGFACE_API_KEY' }, { status: 500 });
    }

    let base64 = imageBase64;
    let mt = mimeType;

    // allow embedding from your /public/Images paths
    if (!base64 && imageUrl) {
      const fromDisk = await readPublicImageAsBase64(imageUrl);
      base64 = fromDisk.base64;
      mt = fromDisk.mimeType;
    }

    if (!base64) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const res = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: toDataUrl(base64, mt),
        options: { wait_for_model: true },
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return Response.json({ error: 'HF request failed', details: text }, { status: res.status });
    }

    const data = JSON.parse(text);
    const embedding = Array.isArray(data?.[0]) ? data[0] : data;

    if (!Array.isArray(embedding)) {
      return Response.json({ error: 'Unexpected HF response', raw: data }, { status: 500 });
    }

    return Response.json({ success: true, embedding });
  } catch (e) {
    console.error('image-embed route error:', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}