export async function parseSearchWithAI(userQuery, artworks) {
  try {
    const prompt = `You are an art gallery search assistant. A customer is searching with this query:

"${userQuery}"

Analyze this search query and extract structured information in JSON format.
Look for:
- Art styles
- Mediums
- Colors or color tones
- Themes or subjects
- Price constraints (ZAR)
- Any other relevant keywords

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "styles": [],
  "mediums": [],
  "colors": [],
  "themes": [],
  "maxPrice": null,
  "minPrice": null,
  "keywords": []
}`;

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) return { useBasicSearch: true };

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { useBasicSearch: true };

    const criteria = JSON.parse(jsonMatch[0]);

    const scored = artworks.map((artwork) => {
      const text = `
        ${artwork.title || ""} 
        ${artwork.artist || ""} 
        ${artwork.style || ""} 
        ${artwork.medium || ""} 
        ${artwork.description || ""} 
        ${(artwork.tags || []).join(" ")}
      `.toLowerCase();

      const maxPrice = criteria.maxPrice ?? null;
      const minPrice = criteria.minPrice ?? null;

      if (maxPrice !== null && typeof artwork.price === "number" && artwork.price > maxPrice)
        return { artwork, score: -1 };
      if (minPrice !== null && typeof artwork.price === "number" && artwork.price < minPrice)
        return { artwork, score: -1 };

      let score = 0;

      (criteria.styles || []).forEach((s) => {
        if ((artwork.style || "").toLowerCase().includes(String(s).toLowerCase())) score += 10;
      });

      (criteria.mediums || []).forEach((m) => {
        if ((artwork.medium || "").toLowerCase().includes(String(m).toLowerCase())) score += 10;
      });

      (criteria.colors || []).forEach((c) => {
        if (text.includes(String(c).toLowerCase())) score += 5;
      });

      (criteria.themes || []).forEach((t) => {
        if (text.includes(String(t).toLowerCase())) score += 5;
      });

      (criteria.keywords || []).forEach((k) => {
        if (text.includes(String(k).toLowerCase())) score += 3;
      });

      return { artwork, score };
    });

    const results = scored
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.artwork);

    return { results, criteria, totalFound: results.length, useBasicSearch: false };
  } catch {
    return { useBasicSearch: true };
  }
}

export function basicKeywordSearch(query, artworks) {
  const q = (query || "").toLowerCase().trim();

  const priceMatch = q.match(/r\s?(\d+[\s,]?\d*)/i);
  const maxPrice = priceMatch ? parseFloat(priceMatch[1].replace(/[\s,]/g, "")) : null;

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "want",
    "looking",
    "find",
    "show",
    "give",
    "under",
  ]);

  const keywords = q
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const scored = artworks.map((artwork) => {
    const fields = `
      ${artwork.title || ""} 
      ${artwork.artist || ""} 
      ${artwork.style || ""} 
      ${artwork.medium || ""} 
      ${artwork.description || ""} 
      ${(artwork.tags || []).join(" ")}
    `.toLowerCase();

    let score = 0;
    keywords.forEach((kw) => {
      if (fields.includes(kw)) score += 2;
      if ((artwork.title || "").toLowerCase().includes(kw)) score += 3;
      if ((artwork.style || "").toLowerCase().includes(kw)) score += 2;
    });

    if (maxPrice !== null && typeof artwork.price === "number" && artwork.price > maxPrice) score = -1;

    return { artwork, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.artwork);
}