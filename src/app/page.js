'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function ArtworkCard({ artwork, auction }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const isInAuction = auction && (auction.status === 'live' || auction.status === 'upcoming');

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(price);

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/artworks/${artwork.id}`);
      return;
    }
    addToCart(artwork);
  };

  return (
    <Link href={isInAuction ? `/auctions/${auction.id}` : `/artworks/${artwork.id}`}>
      <div className="group cursor-pointer">
        <div className="relative overflow-hidden mb-4" style={{ aspectRatio: '4/5' }}>
          <img
            src={artwork.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isInAuction && (
            <div className="absolute top-3 left-3 px-3 py-1.5 text-xs font-semibold" style={{
              background: 'var(--surface)',
              color: 'var(--clay)',
              border: '1px solid var(--border)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              LIVE AUCTION
            </div>
          )}
          {artwork.status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(46, 42, 39, 0.7)' }}>
              <span className="px-6 py-3 font-semibold" style={{
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.875rem'
              }}>
                SOLD
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold transition-colors group-hover:opacity-70" style={{ 
            color: 'var(--text-primary)',
            fontSize: '1.125rem'
          }}>
            {artwork.title}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {artwork.artist}
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {artwork.style && (
              <span className="px-2.5 py-1 text-xs border" style={{
                color: 'var(--text-muted)',
                borderColor: 'var(--border)',
                borderRadius: '2px'
              }}>
                {artwork.style}
              </span>
            )}
            {artwork.medium && (
              <span className="px-2.5 py-1 text-xs border" style={{
                color: 'var(--text-muted)',
                borderColor: 'var(--border)',
                borderRadius: '2px'
              }}>
                {artwork.medium}
              </span>
            )}
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-xs mb-1" style={{ 
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {isInAuction ? 'Current Bid' : 'Price'}
              </p>
              <p className="font-semibold" style={{ 
                color: 'var(--clay)',
                fontSize: '1.25rem'
              }}>
                {formatPrice(isInAuction ? auction.currentBid : artwork.price)}
              </p>
            </div>
            {artwork.status !== 'sold' && !isInAuction && (
              <button
                onClick={handleCartClick}
                className="px-4 py-2 text-xs font-semibold transition-colors"
                style={{
                  background: 'var(--clay)',
                  color: '#F5EFE6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderRadius: '2px',
                  border: 'none'
                }}
              >
                ADD TO CART
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPrompt, setSearchPrompt] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSearching, setImageSearching] = useState(false);
  const [imageResults, setImageResults] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    Promise.all([getAllArtworks(), getAllAuctions()])
      .then(([artworksData, auctionsData]) => {
        setArtworks(artworksData);
        setAuctions(auctionsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getAuctionForArtwork = (artworkId) =>
    auctions.find((a) => a.artworkId === artworkId && (a.status === 'live' || a.status === 'upcoming'));

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchPrompt.trim()) return;

    setSearching(true);
    setImageResults(null);

    const prompt = searchPrompt.toLowerCase();
    const priceMatch = prompt.match(/r\s?(\d+[\s,]?\d*)/i);
    let maxPrice = null;
    if (priceMatch) maxPrice = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));

    const keywords = prompt
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'want', 'looking', 'find', 'show', 'give'].includes(w));

    const scored = artworks.map((artwork) => {
      const fields = [
        artwork.title || '', artwork.artist || '', artwork.style || '',
        artwork.medium || '', artwork.description || '', ...(artwork.tags || []),
      ].join(' ').toLowerCase();

      let score = 0;
      keywords.forEach((kw) => {
        if (fields.includes(kw)) score += 2;
        if ((artwork.title || '').toLowerCase().includes(kw)) score += 3;
        if ((artwork.style || '').toLowerCase().includes(kw)) score += 2;
        if ((artwork.tags || []).some((t) => t.toLowerCase().includes(kw))) score += 2;
      });

      if (maxPrice && artwork.price > maxPrice) score = -1;
      return { artwork, score };
    });

    const results = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.artwork);
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
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(imageFile);
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: imageFile.type, data: base64 } },
              { type: 'text', text: `Analyze this image and extract keywords that describe it as an artwork. Return ONLY a JSON array of keywords (style, colors, subject, mood, medium, technique). Example: ["abstract", "blue", "oil painting", "landscape", "dramatic"]. No other text.` },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const keywords = JSON.parse(clean);

      const scored = artworks.map((artwork) => {
        const fields = [
          artwork.title, artwork.artist, artwork.style,
          artwork.medium, artwork.description, ...(artwork.tags || []),
        ].join(' ').toLowerCase();
        let score = keywords.filter((kw) => fields.includes(kw.toLowerCase())).length;
        return { artwork, score };
      });

      const results = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.artwork);
      setImageResults(results.length > 0 ? results : []);
    } catch (err) {
      console.error('Image search error:', err);
      setImageResults([]);
    } finally {
      setImageSearching(false);
    }
  };

  const displayArtworks = imageResults !== null ? imageResults : searchResults !== null ? searchResults : artworks;

  const featuredArtworks = artworks
    .filter((a) => {
      const inAuction = auctions.some(auction => auction.artworkId === a.id);
      return !inAuction && a.price && a.status === 'available';
    })
    .slice(0, 8);

  const liveAuctions = auctions.filter((a) => a.status === 'live');

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>

      {/* HERO */}
      <section className="py-24 px-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="mb-6" style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '600',
            color: 'var(--text-primary)',
            letterSpacing: '0.03em',
            lineHeight: '1.1'
          }}>
            CURATE
          </h1>
          <p className="mb-3" style={{ 
            fontSize: '1.5rem',
            color: 'var(--clay)',
            letterSpacing: '0.02em'
          }}>
            Contemporary African Art
          </p>
          <p className="mb-16 max-w-2xl mx-auto" style={{ 
            fontSize: '1.125rem',
            color: 'var(--text-muted)',
            lineHeight: '1.7'
          }}>
            Discover unique works from emerging artists. Purchase directly or participate in live auctions.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex max-w-3xl mx-auto border" style={{ 
              background: 'var(--background)',
              borderColor: 'var(--border)',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="Search by style, medium, price..."
                className="flex-1 px-6 py-4 text-lg"
                style={{ 
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={searching}
                className="px-8 py-4 font-semibold"
                style={{
                  background: 'var(--clay)',
                  color: '#F5EFE6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: searching ? 'not-allowed' : 'pointer'
                }}
              >
                {searching ? 'SEARCHING...' : 'SEARCH'}
              </button>
            </div>
          </form>

          {/* Image Upload */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                OR SEARCH BY IMAGE:
              </span>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold border"
                style={{
                  background: 'transparent',
                  color: 'var(--clay)',
                  borderColor: 'var(--clay)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderRadius: '2px'
                }}
              >
                UPLOAD
              </button>
              {imagePreview && (
                <>
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover border" style={{ borderColor: 'var(--border)', borderRadius: '2px' }} />
                  <button
                    onClick={handleImageSearch}
                    disabled={imageSearching}
                    className="px-4 py-2 text-xs font-semibold"
                    style={{
                      background: 'var(--clay)',
                      color: '#F5EFE6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderRadius: '2px',
                      border: 'none'
                    }}
                  >
                    {imageSearching ? 'ANALYZING...' : 'FIND SIMILAR'}
                  </button>
                </>
              )}
            </div>
            {(searchResults !== null || imageResults !== null) && (
              <button onClick={clearSearch} className="text-sm font-medium underline" style={{ color: 'var(--text-muted)' }}>
                Clear search
              </button>
            )}
          </div>
        </div>
      </section>

      {/* LIVE AUCTIONS BANNER */}
      {liveAuctions.length > 0 && !searchResults && !imageResults && (
        <section className="py-3 px-4 border-b" style={{ background: 'var(--clay)', borderColor: 'var(--clay-dark)' }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-xs" style={{ 
                color: '#F5EFE6',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                LIVE NOW
              </span>
              <span style={{ color: 'rgba(245, 239, 230, 0.9)', fontSize: '0.875rem' }}>
                {liveAuctions.length} auction{liveAuctions.length > 1 ? 's' : ''} in progress
              </span>
            </div>
            <Link href="/auctions" className="text-xs font-semibold" style={{ 
              color: '#F5EFE6',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              VIEW AUCTIONS →
            </Link>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* SEARCH RESULTS */}
        {(searchResults !== null || imageResults !== null) ? (
          <div>
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                  {imageResults !== null ? 'Image Search Results' : 'Search Results'}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  {displayArtworks.length === 0
                    ? 'No artworks found'
                    : `${displayArtworks.length} artwork${displayArtworks.length === 1 ? '' : 's'} found`}
                </p>
              </div>
              <button onClick={clearSearch} className="font-medium" style={{ color: 'var(--clay)' }}>
                ← BACK TO HOME
              </button>
            </div>

            {displayArtworks.length === 0 ? (
              <div className="text-center py-20 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
                <h3 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>No results found</h3>
                <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Try different keywords</p>
                <button onClick={clearSearch} className="px-8 py-3 font-semibold" style={{
                  background: 'var(--clay)',
                  color: '#F5EFE6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.875rem',
                  borderRadius: '4px',
                  border: 'none'
                }}>
                  BROWSE ALL
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {displayArtworks.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} auction={getAuctionForArtwork(artwork.id)} />
                ))}
              </div>
            )}
          </div>

        ) : (
          <>
            {/* FEATURED ARTWORKS */}
            <section className="mb-24">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                    Featured Collection
                  </h2>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Curated pieces available for purchase
                  </p>
                </div>
                <Link
                  href="/artworks"
                  className="font-semibold text-sm"
                  style={{
                    color: 'var(--clay)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  VIEW ALL →
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 spinner"></div>
                </div>
              ) : featuredArtworks.length === 0 ? (
                <div className="text-center py-20 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
                  <h3 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Collection coming soon</h3>
                  <p style={{ color: 'var(--text-muted)' }}>New artworks arriving shortly</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                  {featuredArtworks.map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} auction={getAuctionForArtwork(artwork.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* CTA */}
            <section className="py-16 px-8 text-center border" style={{ 
              background: 'var(--clay)',
              borderColor: 'var(--clay-dark)',
              borderRadius: '4px'
            }}>
              <h2 className="mb-6" style={{ 
                fontSize: '2.5rem',
                fontWeight: '600',
                color: '#F5EFE6',
                letterSpacing: '0.02em'
              }}>
                {user ? 'Start Collecting' : 'Begin Your Collection'}
              </h2>
              <p className="mb-10 max-w-2xl mx-auto" style={{ 
                fontSize: '1.125rem',
                color: 'rgba(245, 239, 230, 0.9)'
              }}>
                {user
                  ? 'Explore our curated collection and find your next piece.'
                  : 'Join collectors discovering emerging African artists.'}
              </p>
              {user ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/artworks"
                    className="px-10 py-4 font-semibold"
                    style={{
                      background: '#F5EFE6',
                      color: 'var(--clay)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.875rem',
                      borderRadius: '4px'
                    }}
                  >
                    BROWSE ARTWORKS
                  </Link>
                  <Link
                    href="/auctions"
                    className="px-10 py-4 font-semibold border"
                    style={{
                      background: 'transparent',
                      color: '#F5EFE6',
                      borderColor: '#F5EFE6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.875rem',
                      borderRadius: '4px'
                    }}
                  >
                    VIEW AUCTIONS
                  </Link>
                </div>
              ) : (
                <Link
                  href="/register"
                  className="inline-block px-12 py-5 font-semibold"
                  style={{
                    background: '#F5EFE6',
                    color: 'var(--clay)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.875rem',
                    borderRadius: '4px'
                  }}
                >
                  CREATE ACCOUNT
                </Link>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}