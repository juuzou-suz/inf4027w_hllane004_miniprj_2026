import { NextResponse } from "next/server";

export const runtime = "nodejs";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = process.env.HF_CLIP_MODEL || "openai/clip-vit-base-patch32";

// ✅ Correct router endpoint: model goes here, no task suffix
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

export async function POST(request) {
  try {
    const { imageBase64, artworks } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!artworks?.length) {
      return NextResponse.json({ success: true, results: [], analysis: null });
    }
    if (!HF_API_KEY) {
      return NextResponse.json({ error: "HUGGINGFACE_API_KEY not set" }, { status: 500 });
    }

    // Build labels (keep concise; CLIP prefers short-ish text)
    const labels = artworks.map((a) => {
      const parts = [
        a.title,
        a.artist,
        a.style,
        a.medium,
        ...(Array.isArray(a.tags) ? a.tags.slice(0, 3) : []),
      ].filter(Boolean);
      return parts.join(", ");
    });

    // Strip "data:image/...;base64,"
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const doCall = async () => {
      const res = await fetch(HF_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          // ✅ Common Inference API shape:
          // inputs = base64 string, parameters.candidate_labels = labels
          inputs: base64Data,
          parameters: { candidate_labels: labels },
        }),
      });

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = text; }

      return { res, json, raw: text };
    };

    let { res, json, raw } = await doCall();

    // Cold start: retry once
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 8000));
      ({ res, json, raw } = await doCall());
    }

    if (!res.ok) {
      console.error("HF ERROR", res.status, HF_URL, json);
      return NextResponse.json(
        { success: false, error: `HuggingFace error ${res.status}: ${json?.error || raw}` },
        { status: 502 }
      );
    }

    // HF often returns: [{label, score}, ...]
    const arr = Array.isArray(json) ? json : [];
    const scored = arr
      .map((item) => {
        const i = labels.indexOf(item.label);
        return i >= 0 ? { artwork: artworks[i], score: item.score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    const results = scored
      .filter((x) => x.score > 0.01)
      .slice(0, 8)
      .map((x) => x.artwork);

    const topMatches = scored.slice(0, 5).map((x) => ({
      title: x.artwork?.title || "—",
      score: `${Math.round((x.score || 0) * 100)}%`,
    }));

    return NextResponse.json({
      success: true,
      results,
      analysis: { model: HF_MODEL, topMatches },
    });
  } catch (err) {
    console.error("Image search error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}