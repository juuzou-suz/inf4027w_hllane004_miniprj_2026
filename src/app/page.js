'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Compass,
  Heart,
  Gavel,
  Upload,
} from 'lucide-react';
import { searchArtworksByImage } from '@/lib/imageSearch';
import { useCart } from '@/context/CartContext';
import ArtworkCard from '@/components/artworkCard';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';
import { parseSearchWithAI, basicKeywordSearch } from '@/lib/aiSearch';

const slides = [
  {
    image: '/Images/hero1.jpg',
    title: 'Where Culture Lives',
    subtitle: 'A new home for contemporary African art — grounded, bold, and expressive.',
  },
  {
    image: '/Images/hero2.jpg',
    title: 'Discover Emerging Artists',
    subtitle: 'Explore original works from rising creatives redefining modern African expression.',
  },
  {
    image: '/Images/hero3.jpg',
    title: 'Own a Story',
    subtitle: 'Every artwork carries memory, identity, and meaning. Collect pieces that speak.',
  },
  {
    image: '/Images/hero4.jpg',
    title: 'Bid in Real Time',
    subtitle: 'Experience live auctions built for collectors who move with intention.',
  },
  {
    image: '/Images/hero5.jpg',
    title: 'Collect With Purpose',
    subtitle: 'Support artists directly while building a collection rooted in culture and vision.',
  },
];

const features = [
  {
    icon: Compass,
    title: 'Curated Discovery',
    tagline: 'Find pieces that fit your taste',
    description: 'Browse by style, medium, and price — and filter fast without noise.',
  },
  {
    icon: Heart,
    title: 'Direct Support',
    tagline: 'Back artists, not middlemen',
    description: 'Collect work from emerging artists and support the culture shaping the future.',
  },
  {
    icon: Gavel,
    title: 'Live Auctions',
    tagline: 'Bid with confidence',
    description: 'Real-time bidding that feels premium — clean UI, clear pricing, calm focus on the art.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, []);

  const go = useCallback((dir) => setCurrent((p) => (p + dir + slides.length) % slides.length), []);

  return (
    <section className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'var(--hero-overlay)' }} />
          <div className="absolute inset-0" style={{ background: 'var(--hero-warm-wash)' }} />
        </div>
      ))}

      <div className="relative z-10 flex h-full items-end pb-16 md:pb-24">
        <div className="container">
          <div className="max-w-2xl">
            <span
              className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: 'var(--clay)' }}
            >
              Curate.
            </span>

            <h1
              key={`title-${current}`}
              className="font-display text-4xl font-black leading-tight animate-fade-in md:text-6xl lg:text-6xl"
              style={{ color: 'rgba(245, 239, 230, 0.84)' }}
            >
              {slides[current].title}
            </h1>

            <p
              key={`sub-${current}`}
              className="mt-4 max-w-xl text-base leading-relaxed opacity-0 animate-fade-in md:text-lg"
              style={{ color: 'rgba(245, 239, 230, 0.84)', animationDelay: '0.15s' }}
            >
              {slides[current].subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link
                href="/artworks"
                className="rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:brightness-110"
                style={{ background: 'var(--clay)', color: '#F5EFE6', boxShadow: 'var(--shadow-hero-btn)' }}
              >
                Browse Artworks
              </Link>
              <Link
                href="/auctions"
                className="rounded-full border px-7 py-3.5 text-sm font-semibold transition-all hover:bg-white/10"
                style={{ borderColor: 'rgba(245, 239, 230, 0.25)', color: '#F5EFE6' }}
              >
                View Auctions
              </Link>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border p-3 backdrop-blur-sm transition-all hover:bg-white/20 md:left-6"
        style={{ background: 'rgba(245, 239, 230, 0.08)', color: 'var(--background)', borderColor: 'rgba(245, 239, 230, 0.15)' }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border p-3 backdrop-blur-sm transition-all hover:bg-white/20 md:right-6"
        style={{ background: 'rgba(245, 239, 230, 0.08)', color: 'var(--background)', borderColor: 'rgba(245, 239, 230, 0.15)' }}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === current ? 28 : 8,
              background: i === current ? 'rgba(245, 239, 230, 0.9)' : 'rgba(245, 239, 230, 0.4)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SearchSection({
  liveAuctionCount,
  hasResults,
  onSearch,
  onClear,
  onImageSearch,
  imageSearching,
  imagePreview,
  onImageUpload,
  onImageRemove,   // ✅ new: lets parent know when image is cleared from here
  detectionResults,
  imageSearchError,
}) {
  const [query, setQuery] = useState('');
  const fileInputRef = useRef(null);

  // ✅ Fix: when parent clears results, also reset the local query input
  const handleClear = () => {
    setQuery('');
    onClear();
  };

  // ✅ Fix: remove image without clearing search results
  const handleRemoveImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImageRemove();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <section
      className="border-b py-10"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="container">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Find your next piece
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Search by style, medium, subject, price — or upload an image.
            </p>
          </div>

          {liveAuctionCount > 0 && !hasResults && (
            <span
              className="rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap"
              style={{
                background: 'rgba(175, 114, 35, 0.45)',
                color: 'rgba(245, 239, 230, 0.84)',
                border: '1px solid rgba(24, 74, 52, 0.18)',
              }}
            >
              Live auctions: {liveAuctionCount}
            </span>
          )}
        </div>

        {/* Search row */}
        <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center">

          {/* Text search */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center md:w-[520px] shrink-0"
            style={{ background: '#ffffff', border: '1px solid #ffffff', borderRadius: '0.75rem' }}
          >
            <Search size={16} className="ml-3 shrink-0" style={{ color: '#111111' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: abstract under R2000, portrait charcoal..."
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
              style={{ color: '#111111', background: '#ffffff', border: '1px solid #ffffff', borderRadius: '0.5rem', margin: '4px' }}
            />
            <button
              type="submit"
              className="m-1 rounded-lg px-5 py-2 text-sm font-semibold transition-all hover:brightness-110 shrink-0"
              style={{ background: '#a76b11', color: '#F5EFE6' }}
            >
              Search
            </button>
          </form>

          <span className="text-sm font-medium md:px-1" style={{ color: 'var(--text-muted)' }}>or</span>

          {/* Image upload controls */}
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            {/* ✅ Reset input value so the same file can be re-uploaded */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                onImageUpload(e);
                // reset so same file can trigger onChange again if re-selected
                e.target.value = '';
              }}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-white/50"
              style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              type="button"
            >
              <Upload size={14} />
              {imagePreview ? 'Change image' : 'Upload image'}
            </button>

            {imagePreview && (
              <>
                {/* Image thumbnail with remove button */}
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-10 w-10 rounded-lg border object-cover"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white"
                    style={{ background: 'rgba(0,0,0,0.6)', fontSize: 9 }}
                    type="button"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>

                <button
                  onClick={onImageSearch}
                  disabled={imageSearching}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                  type="button"
                >
                  {imageSearching ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                      Searching…
                    </span>
                  ) : 'Find similar'}
                </button>
              </>
            )}

            {hasResults && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
                type="button"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ✅ HuggingFace cold-start notice while searching */}
        {imageSearching && (
          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            ⏳ First search may take ~10 seconds while the AI model warms up…
          </p>
        )}

        {/* ✅ Error message if image search fails */}
        {imageSearchError && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              background: 'rgba(190,58,38,0.08)',
              borderColor: 'rgba(190,58,38,0.22)',
              color: 'rgba(255,220,215,0.95)',
            }}
          >
            Image search failed: {imageSearchError}. Try a different image or use text search.
          </div>
        )}

        {/* Top match chips */}
        {detectionResults?.topMatches?.length > 0 && (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{ background: 'rgba(160,106,75,0.05)', borderColor: 'var(--border)' }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Closest matches:
            </p>
            <div className="flex flex-wrap gap-2">
              {detectionResults.topMatches.slice(0, 5).map((m, i) => (
                <span
                  key={i}
                  className="rounded-full border px-2.5 py-1 text-xs"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {m.title} — {m.score}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function WhyChooseSection() {
  return (
    <section
      className="min-h-[75vh] flex items-center border-t"
      style={{ borderColor: 'var(--border)', background: 'rgba(232, 216, 195, 0.35)' }}
    >
      <div className="container w-full py-6">
        <h2 className="font-display text-3xl font-black md:text-4xl" style={{ color: 'var(--text-primary)' }}>
          Why choose Curate
        </h2>
        <p className="mt-2 max-w-lg text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
          Built for discovery, collecting, and live auctions — without gatekeeping.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border p-8 transition-shadow duration-300 hover:shadow-lg"
              style={{ borderColor: 'var(--border)', background: 'rgba(245, 239, 230, 0.70)' }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(24, 74, 61, 0.1)' }}>
                <f.icon size={22} style={{ color: 'rgba(8, 8, 8, 0.7)' }} />
              </div>
              <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'rgba(8, 8, 8, 0.7)' }}>{f.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(8, 8, 8, 0.7)' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { addToCart } = useCart();
  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);

  // Image search state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSearching, setImageSearching] = useState(false);
  const [imageSearchError, setImageSearchError] = useState(null); // ✅ new
  const [detectionResults, setDetectionResults] = useState(null);

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

  const getAuctionForArtwork = (artworkId) =>
    auctions.find((a) => a.artworkId === artworkId && (a.status === 'live' || a.status === 'upcoming'));

  const liveAuctions = auctions.filter((a) => a.status === 'live');

  const purchasableArtworks = useMemo(() => {
    return artworks.filter((a) => {
      const inAuction = auctions.some((au) => au.artworkId === a.id);
      return !inAuction && a.price && a.status === 'available';
    });
  }, [artworks, auctions]);

  const applyFilters = useCallback(
    (list) =>
      list.filter((a) => {
        if (filterStyle && a.style !== filterStyle) return false;
        if (filterMedium && a.medium !== filterMedium) return false;
        if (filterMaxPrice && a.price > parseFloat(filterMaxPrice)) return false;
        if (filterAvailable && a.status !== 'available') return false;
        return true;
      }),
    [filterStyle, filterMedium, filterMaxPrice, filterAvailable]
  );

  const handleSearch = async (query) => {
    const q = (query || '').trim();
    if (!q) { setSearchResults(null); return; }

    const { results, useBasicSearch } = await parseSearchWithAI(q, purchasableArtworks);
    if (useBasicSearch) {
      setSearchResults(basicKeywordSearch(q, purchasableArtworks));
    } else {
      setSearchResults(results);
    }
  };

  // ✅ File chosen — store file + preview, don't trigger search yet
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageSearchError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ✅ Remove image without clearing search results
  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageSearchError(null);
    setDetectionResults(null);
  };

  // ✅ "Find similar" clicked — run the actual search
  const handleImageSearch = async () => {
    if (!imageFile) return;

    setImageSearching(true);
    setSearchResults(null);
    setDetectionResults(null);
    setImageSearchError(null);

    try {
      const { success, results, analysis, error } = await searchArtworksByImage(
        imageFile,
        purchasableArtworks
      );

      if (!success || error) {
        setImageSearchError(error || 'Unknown error');
        setSearchResults([]);
        return;
      }

      setSearchResults(results);
      setDetectionResults(analysis || null);
    } catch (err) {
      console.error('Image search error:', err);
      setImageSearchError(err.message);
      setSearchResults([]);
    } finally {
      setImageSearching(false);
    }
  };

  // ✅ Clear everything — search results, image, error
  const clearSearch = () => {
    setSearchResults(null);
    setImageFile(null);
    setImagePreview(null);
    setDetectionResults(null);
    setImageSearchError(null);
  };

  const displayArtworks = applyFilters(searchResults ?? purchasableArtworks);

  const sortByNewest = (list) =>
    [...list].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });

  const featuredFirst = sortByNewest(purchasableArtworks.filter((a) => a.featured === true));
  const fillRest = sortByNewest(purchasableArtworks.filter((a) => a.featured !== true));
  const featuredArtworks = [...featuredFirst, ...fillRest].slice(0, 4);

  const hasResults = searchResults !== null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <HeroSlideshow />

      <SearchSection
        liveAuctionCount={liveAuctions.length}
        hasResults={hasResults}
        onSearch={handleSearch}
        onClear={clearSearch}
        onImageSearch={handleImageSearch}
        imageSearching={imageSearching}
        imagePreview={imagePreview}
        onImageUpload={handleImageUpload}
        onImageRemove={handleImageRemove}
        detectionResults={detectionResults}
        imageSearchError={imageSearchError}
      />

      <main className="min-h-[75vh] flex items-center">
        <div className="container w-full py-16">
          {loading ? (
            <div className="flex justify-center py-16">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--forest)' }}
              />
            </div>
          ) : hasResults ? (
            <section>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {imageFile ? 'Image search results' : 'Search results'}
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {displayArtworks.length === 0
                      ? 'No artworks found'
                      : `${displayArtworks.length} artwork${displayArtworks.length === 1 ? '' : 's'} found`}
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                  style={{ color: 'var(--forest)' }}
                  type="button"
                >
                  Back to all
                  <ArrowRight size={16} />
                </button>
              </div>

              {displayArtworks.length === 0 ? (
                <div className="py-20 text-center">
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    No results found
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Try a different image or search term.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayArtworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      auction={getAuctionForArtwork(artwork.id)}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                    Featured Artworks
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Curated pieces available for purchase
                  </p>
                </div>
                <Link
                  href="/artworks"
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                  style={{ color: 'rgba(245, 239, 230, 0.84)' }}
                >
                  View all
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredArtworks.map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    auction={getAuctionForArtwork(artwork.id)}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <WhyChooseSection />
    </div>
  );
}