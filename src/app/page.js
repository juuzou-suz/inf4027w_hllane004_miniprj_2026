'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';

import ArtworkCard from '@/components/artworkCard';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';

/* ──────────────────────────────────────────────────────────────
   Hero Slides (public/Images)
   IMPORTANT: case-sensitive filenames in production.
   Make sure these EXACT paths exist:
   /public/Images/hero1.jpg ... hero5.jpg
────────────────────────────────────────────────────────────── */
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

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((p) => (p + 1) % slides.length),
      6500
    );
    return () => clearInterval(timer);
  }, []);

  const go = useCallback(
    (dir) => setCurrent((p) => (p + dir + slides.length) % slides.length),
    []
  );

  return (
    <section className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'var(--hero-overlay)' }} />
          <div className="absolute inset-0" style={{ background: 'var(--hero-warm-wash)' }} />
        </div>
      ))}

      {/* Content */}
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
              style={{ color: 'var(--background)' }}
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

            <div
              className="mt-8 flex flex-wrap gap-3 opacity-0 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                href="/artworks"
                className="rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:brightness-110"
                style={{
                  background: 'var(--clay)',
                  color: '#F5EFE6',
                  boxShadow: 'var(--shadow-hero-btn)',
                }}
              >
                Browse Artworks
              </Link>

              <Link
                href="/auctions"
                className="rounded-full border px-7 py-3.5 text-sm font-semibold transition-all hover:bg-white/10"
                style={{
                  borderColor: 'rgba(245, 239, 230, 0.25)',
                  color: 'var(--background)',
                }}
              >
                View Auctions
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border p-3 backdrop-blur-sm transition-all hover:bg-white/20 md:left-6"
        style={{
          background: 'rgba(245, 239, 230, 0.08)',
          color: 'var(--background)',
          borderColor: 'rgba(245, 239, 230, 0.15)',
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border p-3 backdrop-blur-sm transition-all hover:bg-white/20 md:right-6"
        style={{
          background: 'rgba(245, 239, 230, 0.08)',
          color: 'var(--background)',
          borderColor: 'rgba(245, 239, 230, 0.15)',
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === current ? 28 : 8,
              background:
                i === current
                  ? 'rgba(245, 239, 230, 0.9)'
                  : 'rgba(245, 239, 230, 0.4)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function SearchSection({
  styles,
  mediums,
  liveAuctionCount,
  hasResults,
  onSearch,
  onClear,
  filterStyle,
  filterMedium,
  filterMaxPrice,
  filterAvailable,
  onFilterStyle,
  onFilterMedium,
  onFilterMaxPrice,
  onFilterAvailable,
  onClearFilters,
}) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <section
      className="border-b py-10"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface)',
      }}
    >
      <div className="container">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Find your next piece
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Search by style, medium, subject, or price.
            </p>
          </div>

          {liveAuctionCount > 0 && !hasResults && (
            <span
              className="rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap"
              style={{
                background: 'rgba(175, 114, 35, 0.45)', // forest tint
                color: 'var(--forest)',
                border: '1px solid rgba(24, 74, 52, 0.18)',
              }}
            >
              Live auctions: {liveAuctionCount}
            </span>
          )}
        </div>

{/* Search bar */}
<form
  onSubmit={handleSubmit}
  className="flex items-center rounded-full shadow-sm"
  style={{
    background: '#ffffff',
    border: '1px solid var(--border)',
  }}
>
  <div className="flex flex-1 items-center px-5 py-3">
    <Search size={18} style={{ color: 'var(--text-muted)' }} />

    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Try: abstract under R2000, portrait charcoal, beige sculpture"
      className="ml-3 flex-1 bg-transparent text-sm outline-none md:text-base"
      style={{ color: 'var(--text-primary)' }}
    />
  </div>

  <button
    type="submit"
    className="mr-1.5 rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
    style={{
      background: '#a76b11',
      color: '#F5EFE6',
    }}
  >
    Search
  </button>
</form>
        {/* Action row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {hasResults && (
            <button
              onClick={() => {
                setQuery('');
                onClear();
              }}
              className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
                background: 'transparent',
              }}
            >
              <X size={14} />
              Clear search
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function WhyChooseSection() {
  return (
<section
  className="min-h-[75vh] flex items-center border-t"
  style={{
    borderColor: 'var(--border)',
    background: 'rgba(232, 216, 195, 0.35)',
  }}
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
              style={{
                borderColor: 'var(--border)',
                background: 'rgba(245, 239, 230, 0.70)',
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(24, 74, 52, 0.10)' }}
              >
                <f.icon size={22} style={{ color: 'var(--forest)' }} />
              </div>
              <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {f.title}
              </h3>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                {f.tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);

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

  const styles = useMemo(
    () => [...new Set(artworks.map((a) => a.style).filter(Boolean))],
    [artworks]
  );
  const mediums = useMemo(
    () => [...new Set(artworks.map((a) => a.medium).filter(Boolean))],
    [artworks]
  );

  const getAuctionForArtwork = (artworkId) =>
    auctions.find(
      (a) => a.artworkId === artworkId && (a.status === 'live' || a.status === 'upcoming')
    );

  const liveAuctions = auctions.filter((a) => a.status === 'live');

  const handleSearch = (query) => {
    const prompt = query.toLowerCase();
    const priceMatch = prompt.match(/r\s?(\d+[\s,]?\d*)/i);
    const maxPrice = priceMatch ? parseFloat(priceMatch[1].replace(/[\s,]/g, '')) : null;

    const stopWords = new Set([
      'the','and','for','with','that','this','want','looking','find','show','give','under'
    ]);

    const keywords = prompt
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const scored = artworks.map((artwork) => {
      const fields = [
        artwork.title,
        artwork.artist,
        artwork.style,
        artwork.medium,
        artwork.description,
        ...(artwork.tags || []),
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      for (const kw of keywords) {
        if (fields.includes(kw)) score += 2;
        if ((artwork.title || '').toLowerCase().includes(kw)) score += 3;
        if ((artwork.style || '').toLowerCase().includes(kw)) score += 2;
        if ((artwork.tags || []).some((t) => t.toLowerCase().includes(kw))) score += 2;
      }

      if (maxPrice && artwork.price > maxPrice) score = -1;
      return { artwork, score };
    });

    setSearchResults(
      scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.artwork)
    );
  };

  const clearSearch = () => setSearchResults(null);

  const applyFilters = (list) =>
    list.filter((a) => {
      if (filterStyle && a.style !== filterStyle) return false;
      if (filterMedium && a.medium !== filterMedium) return false;
      if (filterMaxPrice && a.price > parseFloat(filterMaxPrice)) return false;
      if (filterAvailable && a.status !== 'available') return false;
      return true;
    });

  const displayArtworks = applyFilters(searchResults ?? artworks);

  const featuredArtworks = artworks
    .filter((a) => {
      const inAuction = auctions.some((au) => au.artworkId === a.id);
      return !inAuction && a.price && a.status === 'available';
    })
    .slice(0, 4);

  const hasResults = searchResults !== null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <HeroSlideshow />

      <SearchSection
        styles={styles}
        mediums={mediums}
        liveAuctionCount={liveAuctions.length}
        hasResults={hasResults}
        onSearch={handleSearch}
        onClear={clearSearch}
        filterStyle={filterStyle}
        filterMedium={filterMedium}
        filterMaxPrice={filterMaxPrice}
        filterAvailable={filterAvailable}
        onFilterStyle={setFilterStyle}
        onFilterMedium={setFilterMedium}
        onFilterMaxPrice={setFilterMaxPrice}
        onFilterAvailable={setFilterAvailable}
        onClearFilters={() => {
          setFilterStyle('');
          setFilterMedium('');
          setFilterMaxPrice('');
          setFilterAvailable(false);
        }}
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
                    Search results
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
                    Try different keywords or remove filters.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayArtworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      auction={getAuctionForArtwork(artwork.id)}
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
                    Featured Collection
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Curated pieces available for purchase
                  </p>
                </div>

                <Link
                  href="/artworks"
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                  style={{ color: 'var(--forest)' }}
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