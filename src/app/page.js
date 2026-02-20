'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Artwork Card ────────────────────────────────────────────────────────────
function ArtworkCard({ artwork, auction }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const isInAuction = auction && (auction.status === 'live' || auction.status === 'upcoming');

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(price);

  const handleCartClick = () => {
    if (!user) {
      router.push(`/login?redirect=/artworks/${artwork.id}`);
      return;
    }
    addToCart(artwork);
    alert(`"${artwork.title}" added to cart!`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group">
      <div className="relative overflow-hidden h-52">
        <img
          src={artwork.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        {isInAuction && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            🔴 Live Auction
          </div>
        )}
        {artwork.status === 'sold' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-full">SOLD</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{artwork.title}</h3>
        <p className="text-gray-600 text-sm mb-2">by {artwork.artist}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {artwork.style && <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">{artwork.style}</span>}
          {artwork.medium && <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">{artwork.medium}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            {isInAuction ? (
              <div>
                <p className="text-xs text-gray-500">Current Bid</p>
                <p className="text-xl font-bold text-red-600">{formatPrice(auction.currentBid)}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-xl font-bold text-purple-600">{formatPrice(artwork.price)}</p>
              </div>
            )}
          </div>
          {artwork.status !== 'sold' && (
            isInAuction ? (
              <Link
                href={`/auctions/${auction.id}`}
                className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
              >
                Bid Now
              </Link>
            ) : (
              <button
                onClick={handleCartClick}
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Add to Cart
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Homepage ───────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchPrompt, setSearchPrompt] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [searching, setSearching] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSearching, setImageSearching] = useState(false);
  const [imageResults, setImageResults] = useState(null);
  const fileInputRef = useRef(null);

  // Filter state
  const [filterStyle, setFilterStyle] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  useEffect(() => {
    Promise.all([getAllArtworks(), getAllAuctions()])
      .then(([artworksData, auctionsData]) => {
        setArtworks(artworksData);
        setAuctions(auctionsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get auction for artwork
  const getAuctionForArtwork = (artworkId) =>
    auctions.find(
      (a) => a.artworkId === artworkId && (a.status === 'live' || a.status === 'upcoming')
    );

  // All unique styles and mediums for filter dropdowns
  const styles = [...new Set(artworks.map((a) => a.style).filter(Boolean))];
  const mediums = [...new Set(artworks.map((a) => a.medium).filter(Boolean))];

  // ── Smart Text Search ──────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchPrompt.trim()) return;

    setSearching(true);
    setImageResults(null); // clear image results

    const prompt = searchPrompt.toLowerCase();

    // Extract price limit from prompt
    const priceMatch = prompt.match(/r\s?(\d+[\s,]?\d*)/i);
    let maxPrice = null;
    if (priceMatch) {
      maxPrice = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));
    }

    // Keywords to match against artwork fields
    const keywords = prompt
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'want', 'looking', 'find', 'show', 'give'].includes(w));

    // Score each artwork
    const scored = artworks.map((artwork) => {
      const fields = [
        artwork.title || '',
        artwork.artist || '',
        artwork.style || '',
        artwork.medium || '',
        artwork.description || '',
        ...(artwork.tags || []),
      ].join(' ').toLowerCase();

      let score = 0;
      keywords.forEach((kw) => {
        if (fields.includes(kw)) score += 2;
        if ((artwork.title || '').toLowerCase().includes(kw)) score += 3;
        if ((artwork.style || '').toLowerCase().includes(kw)) score += 2;
        if ((artwork.tags || []).some((t) => t.toLowerCase().includes(kw))) score += 2;
      });

      // Price filter
      if (maxPrice && artwork.price > maxPrice) score = -1;

      return { artwork, score };
    });

    const results = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.artwork);

    setSearchResults(results);
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchPrompt('');
    setSearchResults(null);
    setImageResults(null);
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Image Upload Search ───────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageSearch = async () => {
    if (!imageFile) return;
    setImageSearching(true);
    setSearchResults(null);

    try {
      // Convert image to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(imageFile);
      });

      // Call Claude API to analyze image
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: imageFile.type, data: base64 },
              },
              {
                type: 'text',
                text: `Analyze this image and extract keywords that describe it as an artwork. Return ONLY a JSON array of keywords (style, colors, subject, mood, medium, technique). Example: ["abstract", "blue", "oil painting", "landscape", "dramatic"]. No other text.`,
              },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const keywords = JSON.parse(clean);

      // Match artworks against keywords
      const scored = artworks.map((artwork) => {
        const fields = [
          artwork.title, artwork.artist, artwork.style,
          artwork.medium, artwork.description, ...(artwork.tags || []),
        ].join(' ').toLowerCase();

        let score = keywords.filter((kw) => fields.includes(kw.toLowerCase())).length;
        return { artwork, score };
      });

      const results = scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.artwork);

      setImageResults(results.length > 0 ? results : []);
    } catch (err) {
      console.error('Image search error:', err);
      setImageResults([]);
    } finally {
      setImageSearching(false);
    }
  };

  // ── Apply sidebar filters ─────────────────────────────────────────────────
  const applyFilters = (list) => {
    return list.filter((artwork) => {
      if (filterStyle && artwork.style !== filterStyle) return false;
      if (filterMedium && artwork.medium !== filterMedium) return false;
      if (filterMaxPrice && artwork.price > parseFloat(filterMaxPrice)) return false;
      if (filterAvailable && artwork.status !== 'available') return false;
      return true;
    });
  };

  const displayArtworks = applyFilters(
    imageResults !== null ? imageResults :
    searchResults !== null ? searchResults :
    artworks
  );

  const featuredArtworks = artworks.filter((a) => a.status === 'available').slice(0, 4);
  const liveAuctions = auctions.filter((a) => a.status === 'live');

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO + SEARCH ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🎨 Curate
          </h1>
          <p className="text-xl text-purple-200 mb-3">
            Your premier destination for emerging art
          </p>
          <p className="text-purple-300 mb-10 max-w-2xl mx-auto">
            Discover, collect, and bid on unique artworks from talented artists worldwide.
            Buy directly or compete in real-time auctions.
          </p>

          {/* AI Prompt Search */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden">
              <input
                type="text"
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="Describe what you're looking for... e.g. 'blue abstract painting under R2000' or 'landscape oil painting'"
                className="flex-1 px-6 py-5 text-gray-900 text-lg outline-none"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-purple-600 text-white px-8 py-5 hover:bg-purple-700 transition font-semibold text-lg"
              >
                {searching ? '...' : '🔍 Search'}
              </button>
            </div>
          </form>

          {/* Image Upload */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-purple-200 text-sm">Or find by image:</span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
              >
                📷 Upload Image
              </button>
              {imagePreview && (
                <>
                  <img src={imagePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  <button
                    onClick={handleImageSearch}
                    disabled={imageSearching}
                    className="bg-purple-500 hover:bg-purple-400 text-white text-sm px-4 py-2 rounded-lg transition font-medium"
                  >
                    {imageSearching ? 'Searching...' : 'Find Similar'}
                  </button>
                </>
              )}
            </div>
            {(searchResults !== null || imageResults !== null) && (
              <button onClick={clearSearch} className="text-purple-300 hover:text-white text-sm underline transition">
                Clear search
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── LIVE AUCTIONS BANNER ──────────────────────────────────────────── */}
      {liveAuctions.length > 0 && (
        <section className="bg-red-600 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="animate-pulse text-white font-bold">🔴 LIVE NOW</span>
              <span className="text-red-100 text-sm">
                {liveAuctions.length} auction{liveAuctions.length > 1 ? 's' : ''} happening right now!
              </span>
            </div>
            <Link href="/auctions" className="bg-white text-red-600 text-sm font-bold px-4 py-1 rounded-full hover:bg-red-50 transition">
              Bid Now →
            </Link>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── SEARCH RESULTS ────────────────────────────────────────────────── */}
        {(searchResults !== null || imageResults !== null) ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {imageResults !== null ? '🖼️ Image Search Results' : '🔍 Search Results'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {displayArtworks.length === 0
                    ? 'No artworks found matching your search'
                    : `Found ${displayArtworks.length} artwork${displayArtworks.length === 1 ? '' : 's'}`}
                  {searchPrompt && ` for "${searchPrompt}"`}
                </p>
              </div>
              <button onClick={clearSearch} className="text-purple-600 hover:text-purple-800 font-medium transition">
                ← Back to All
              </button>
            </div>

            {displayArtworks.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">Try different keywords or browse all artworks</p>
                <button onClick={clearSearch} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
                  Browse All Artworks
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayArtworks.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} auction={getAuctionForArtwork(artwork.id)} />
                ))}
              </div>
            )}
          </div>

        ) : (
          <>
            {/* ── FEATURED ARTWORKS ─────────────────────────────────────────── */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Featured Artworks</h2>
                  <p className="text-gray-600 mt-1">Handpicked pieces from our collection</p>
                </div>
                <Link href="/artworks" className="text-purple-600 hover:text-purple-800 font-semibold transition">
                  View All →
                </Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredArtworks.map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} auction={getAuctionForArtwork(artwork.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* ── BROWSE WITH FILTERS ───────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Browse Collection</h2>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Filter Sidebar */}
                <aside className="lg:w-64 flex-shrink-0">
                  <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
                    <h3 className="font-bold text-gray-900 text-lg mb-4">Filter By</h3>

                    {/* Style */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                      <select
                        value={filterStyle}
                        onChange={(e) => setFilterStyle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">All Styles</option>
                        {styles.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Medium */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Medium</label>
                      <select
                        value={filterMedium}
                        onChange={(e) => setFilterMedium(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">All Mediums</option>
                        {mediums.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Max Price */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (ZAR)</label>
                      <input
                        type="number"
                        value={filterMaxPrice}
                        onChange={(e) => setFilterMaxPrice(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Available only */}
                    <div className="mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterAvailable}
                          onChange={(e) => setFilterAvailable(e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700">Available only</span>
                      </label>
                    </div>

                    {/* Clear Filters */}
                    <button
                      onClick={() => { setFilterStyle(''); setFilterMedium(''); setFilterMaxPrice(''); setFilterAvailable(false); }}
                      className="w-full text-center text-sm text-purple-600 hover:text-purple-800 font-medium transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                </aside>

                {/* Artworks Grid */}
                <div className="flex-1">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : displayArtworks.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-md">
                      <div className="text-6xl mb-4">🎨</div>
                      <p className="text-gray-600 mb-4">No artworks match your filters</p>
                      <button
                        onClick={() => { setFilterStyle(''); setFilterMedium(''); setFilterMaxPrice(''); setFilterAvailable(false); }}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-4">{displayArtworks.length} artworks</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayArtworks.map((artwork) => (
                          <ArtworkCard key={artwork.id} artwork={artwork} auction={getAuctionForArtwork(artwork.id)} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}