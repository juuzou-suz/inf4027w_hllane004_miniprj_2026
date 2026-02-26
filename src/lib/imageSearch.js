// lib/imageSearch.js
// Called by the homepage's handleImageSearch.
// Converts the File to base64, sends it to /api/search-by-image,
// returns { success, results, analysis } — exactly what the homepage expects.

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // "data:image/jpeg;base64,..."
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export async function searchArtworksByImage(imageFile, artworks) {
  try {
    if (!imageFile) throw new Error('No image file provided');
    if (!artworks?.length) return { success: true, results: [], analysis: null };

    const imageBase64 = await fileToBase64(imageFile);

    // Send only the fields CLIP needs for label building — keeps payload small
    const artworksPayload = artworks.map((a) => ({
      id:          a.id,
      title:       a.title,
      artist:      a.artist,
      style:       a.style       || '',
      medium:      a.medium      || '',
      description: a.description || '',
      tags:        a.tags        || [],
      // Pass through display fields so ArtworkCard renders correctly
      imageUrl:    a.imageUrl    || '',
      price:       a.price,
      status:      a.status,
      startingBid: a.startingBid,
      featured:    a.featured,
      createdAt:   a.createdAt,
    }));

    const response = await fetch('/api/search-by-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, artworks: artworksPayload }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const data = await response.json();

    return {
      success:  data.success  ?? true,
      results:  data.results  || [],
      analysis: data.analysis || null,
      error:    data.error    || null,
    };

  } catch (err) {
    console.error('searchArtworksByImage:', err);
    return { success: false, results: [], analysis: null, error: err.message };
  }
}