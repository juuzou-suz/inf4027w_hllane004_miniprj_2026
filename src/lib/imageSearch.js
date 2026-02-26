// src/lib/imageSearch.js
// Image similarity search using stored CLIP embeddings

export async function searchArtworksByImage(imageFile, artworks) {
  try {
    // Convert upload to base64 (no prefix)
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(String(e.target.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Get embedding for uploaded image (1 API call)
    const response = await fetch('/api/image-embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Image,
        mimeType: imageFile.type || 'image/jpeg',
      }),
    });

    const errOrJson = await response.json().catch(() => ({}));
    if (!response.ok || !errOrJson?.success) {
      console.error('Embed endpoint failed:', errOrJson);
      throw new Error(errOrJson?.error || 'Failed to embed uploaded image');
    }

    const queryVec = errOrJson.embedding;

    // Compare with stored embeddings
    const scored = artworks
      .filter((a) => Array.isArray(a.embedding) && a.embedding.length === queryVec.length)
      .map((artwork) => ({
        artwork,
        score: cosineSimilarity(queryVec, artwork.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    const results = scored
      .filter((x) => x.score > 0.15) // tune threshold
      .slice(0, 24)
      .map((x) => x.artwork);

    return {
      success: true,
      results,
      totalFound: results.length,
      analysis: {
        topMatches: scored.slice(0, 5).map((x) => ({
          title: x.artwork.title || 'Untitled',
          score: Math.round(x.score * 100) + '%',
        })),
      },
    };
  } catch (error) {
    console.error('Image search error:', error);
    return { success: false, error: error.message || 'Image search failed', results: [] };
  }
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}