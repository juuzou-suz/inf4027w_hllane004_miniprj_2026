// src/lib/imageSearch.js

/**
 * Searches artworks by visual similarity using Gemini's image analysis.
 * Gemini extracts labels, colors, and web entities from the uploaded image,
 * then we score each artwork based on how well its metadata matches those signals.
 */
export async function searchArtworksByImage(imageFile, artworks) {
  try {
    // 1. Convert image to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // 2. Build a prompt that asks Gemini to be generous and descriptive
    const prompt = `
You are a visual analysis system for an art/product store.
Analyze this image carefully and return ONLY valid JSON — no markdown, no code fences, no commentary.

Return this exact schema:
{
  "labels": [{"description": "string", "score": number}],
  "colors": [{"name": "string", "score": number}],
  "webEntities": [{"description": "string", "score": number}]
}

Rules:
- labels: 15-25 descriptive concepts covering subject matter, style, mood, technique, materials, setting, and any objects visible. Be specific AND broad (e.g. "portrait", "woman", "oil painting", "realism", "indoor", "warm lighting", "fabric", "classical art").
- colors: 4-8 dominant colors as simple names (e.g. "red", "dark blue", "beige", "gold", "black").
- webEntities: 8-15 broader category terms useful for product/art discovery (e.g. "fine art", "modern art", "African sculpture", "wall decor", "home decor", "figurative art", "abstract painting").
- scores: float between 0.0 and 1.0 representing confidence/relevance.
- Output must be a single valid JSON object. Nothing else.
`;

    // 3. Call our Gemini API route
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        mimeType: imageFile.type || 'image/jpeg',
        prompt,
        maxTokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Gemini endpoint failed:', err);
      throw new Error(err?.error || 'Gemini API failed');
    }

    const geminiData = await response.json();
    console.log('[ImageSearch] Gemini response:', geminiData);

    if (!geminiData.success) {
      throw new Error(geminiData.error || 'Gemini returned an error');
    }

    // 4. Extract and normalize Gemini's analysis
    const labels = Array.isArray(geminiData.labels) ? geminiData.labels : [];
    const colors = Array.isArray(geminiData.colors) ? geminiData.colors : [];
    const webEntities = Array.isArray(geminiData.webEntities) ? geminiData.webEntities : [];

    const safeLabels = labels
      .filter((l) => l?.description)
      .map((l) => ({
        description: String(l.description).toLowerCase().trim(),
        score: Math.min(1, Math.max(0, Number(l.score) || 0.5)),
      }));

    const safeEntities = webEntities
      .filter((e) => e?.description)
      .map((e) => ({
        description: String(e.description).toLowerCase().trim(),
        score: Math.min(1, Math.max(0, Number(e.score) || 0.5)),
      }));

    const safeColors = colors
      .filter((c) => c?.name)
      .map((c) => ({
        name: String(c.name).toLowerCase().trim(),
        score: Math.min(1, Math.max(0, Number(c.score) || 0.5)),
      }));

    console.log('[ImageSearch] Labels:', safeLabels.map((l) => l.description));
    console.log('[ImageSearch] Colors:', safeColors.map((c) => c.name));
    console.log('[ImageSearch] Entities:', safeEntities.map((e) => e.description));

    // 5. Build a flat set of all meaningful keywords from Gemini's response
    // These are the "search tokens" we'll try to find in artwork metadata
    const allKeywords = [
      ...safeLabels.map((l) => ({ term: l.description, weight: l.score * 15, source: 'label' })),
      ...safeEntities.map((e) => ({ term: e.description, weight: e.score * 12, source: 'entity' })),
      ...safeColors.map((c) => ({ term: c.name, weight: c.score * 8, source: 'color' })),
    ];

    // Also extract individual words from multi-word labels/entities for partial matching
    const wordTokens = [];
    [...safeLabels, ...safeEntities].forEach((item) => {
      const words = item.description.split(/\s+/).filter((w) => w.length > 3);
      words.forEach((word) => {
        wordTokens.push({ term: word, weight: item.score * 5, source: 'word' });
      });
    });

    // 6. Score each artwork
    const scoredArtworks = artworks.map((artwork) => {
      let score = 0;
      const hits = [];

      // Flatten all artwork metadata into one searchable string
      const artworkText = [
        artwork.title || '',
        artwork.artist || '',
        artwork.style || '',
        artwork.medium || '',
        artwork.description || '',
        artwork.category || '',
        artwork.type || '',
        ...(Array.isArray(artwork.tags) ? artwork.tags : []),
        ...(Array.isArray(artwork.materials) ? artwork.materials : []),
      ]
        .join(' ')
        .toLowerCase();

      // Match full phrases first (highest value)
      allKeywords.forEach(({ term, weight, source }) => {
        if (artworkText.includes(term)) {
          score += weight;
          hits.push({ term, weight, source });
        }
      });

      // Match individual words (partial credit)
      wordTokens.forEach(({ term, weight }) => {
        if (artworkText.includes(term)) {
          // Only add partial credit if the full phrase didn't already match
          const alreadyMatched = hits.some((h) => h.term.includes(term));
          if (!alreadyMatched) {
            score += weight;
          }
        }
      });

      return { artwork, score, hits };
    });

    // 7. Sort and filter
    // Use a very low threshold so we don't miss anything remotely relevant
    const minScore = 3;
    const results = scoredArtworks
      .filter((x) => x.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.artwork);

    console.log(
      '[ImageSearch] Scored results (top 5):',
      scoredArtworks
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((x) => ({ title: x.artwork.title, score: x.score, hits: x.hits.map((h) => h.term) }))
    );

    return {
      success: true,
      results,
      totalFound: results.length,
      analysis: {
        detectedLabels: safeLabels.slice(0, 10),
        dominantColors: safeColors.slice(0, 6),
        webEntities: safeEntities.slice(0, 8),
      },
    };
  } catch (error) {
    console.error('[ImageSearch] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to search by image',
      results: [],
    };
  }
}