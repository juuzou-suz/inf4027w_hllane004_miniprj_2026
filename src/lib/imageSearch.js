function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function scoreArtwork(artwork, analysis) {
  let score = 0;

  const artworkText = [
    artwork.title,
    artwork.description,
    artwork.style,
    artwork.medium,
    artwork.mood,
    Array.isArray(artwork.tags) ? artwork.tags.join(' ') : artwork.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const check = (term, weight) => {
    if (term && artworkText.includes(term.toLowerCase())) score += weight;
  };

  analysis.subjects?.forEach((s) => check(s, 3));
  analysis.keywords?.forEach((k) => check(k, 2));
  analysis.colors?.forEach((c) => check(c, 1));
  check(analysis.style, 4);
  check(analysis.medium, 3);
  check(analysis.mood, 2);

  // Partial word match bonus (smaller weight to avoid false positives)
  analysis.keywords?.forEach((keyword) => {
    const kw = keyword.toLowerCase();
    if (!artworkText.includes(kw)) {
      const partial = kw.slice(0, Math.max(4, kw.length - 2));
      if (partial.length >= 4 && artworkText.includes(partial)) {
        score += 0.5;
      }
    }
  });

  return score;
}

export async function searchArtworksByImage(imageFile, artworks) {
  try {
    const imageBase64 = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    const res = await fetch('/api/huggingface', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Huggingface failed', results: [] };
    }

    const { analysis } = data;

    // ✅ Score all artworks
    const scored = artworks
      .map((artwork) => ({ ...artwork, _score: scoreArtwork(artwork, analysis) }))
      .filter((a) => a._score > 0)
      .sort((a, b) => b._score - a._score);

    // ✅ Only keep results above a meaningful threshold
    // Use top score as baseline — only show artworks within 60% of the best match
    const topScore = scored[0]?._score ?? 0;
    const MIN_ABSOLUTE_SCORE = 3;   // must have at least one strong match
    const MIN_RELATIVE_SCORE = topScore * 0.4; // within 40% of best result
    const threshold = Math.max(MIN_ABSOLUTE_SCORE, MIN_RELATIVE_SCORE);

    const filtered = scored.filter((a) => a._score >= threshold);

    // Cap at 12 results max
    const results = filtered.slice(0, 12);

    return {
      success: true,
      results,
      analysis: {
        detectedKeywords: [
          ...(analysis.subjects || []),
          ...(analysis.keywords || []),
        ].slice(0, 8),
        colors: analysis.colors || [],
        description: analysis.description || '',
      },
    };
  } catch (err) {
    console.error('searchArtworksByImage error:', err);
    return { success: false, error: err.message, results: [] };
  }
}