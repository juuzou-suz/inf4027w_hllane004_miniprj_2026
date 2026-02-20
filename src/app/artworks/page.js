'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';
import ArtworkCard from '@/components/artworkCard';

function FiltersBar({
  styles,
  mediums,
  query,
  setQuery,
  onSubmitQuery,
  hasResults,
  onClearSearch,
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
  return (
    <section className="border-b py-6" style={{ borderColor: 'var(--border)' }}>
      <div className="container">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Browse artworks
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Search and filter without the noise.
          </p>
        </div>

        {/* One compact row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          {/* Small Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitQuery();
            }}
            className="flex items-center rounded-full shadow-sm"
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              height: 42,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <div className="flex flex-1 items-center px-4">
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artworks..."
                className="ml-2 flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            <button
              type="submit"
              className="mr-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:brightness-110"
              style={{ background: 'var(--clay)', color: '#F5EFE6' }}
            >
              Search
            </button>
          </form>

          {/* Filters next to it */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <select
              value={filterStyle}
              onChange={(e) => onFilterStyle(e.target.value)}
              className="rounded-md border px-3 text-sm outline-none"
              style={{
                borderColor: 'var(--border)',
                background: '#fff',
                color: 'var(--text-primary)',
                height: 42,
              }}
            >
              <option value="">All styles</option>
              {styles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterMedium}
              onChange={(e) => onFilterMedium(e.target.value)}
              className="rounded-md border px-3 text-sm outline-none"
              style={{
                borderColor: 'var(--border)',
                background: '#fff',
                color: 'var(--text-primary)',
                height: 42,
              }}
            >
              <option value="">All mediums</option>
              {mediums.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={filterMaxPrice}
              onChange={(e) => onFilterMaxPrice(e.target.value)}
              placeholder="Max ZAR"
              className="w-28 rounded-md border px-3 text-sm outline-none"
              style={{
                borderColor: 'var(--border)',
                background: '#fff',
                color: 'var(--text-primary)',
                height: 42,
              }}
            />

            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={filterAvailable}
                onChange={(e) => onFilterAvailable(e.target.checked)}
                style={{ accentColor: 'var(--forest)' }}
              />
              Available
            </label>

            {/* Actions */}
            {hasResults && (
              <button
                onClick={onClearSearch}
                className="flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors hover:opacity-90"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  height: 42,
                }}
                type="button"
              >
                <X size={14} />
                Clear search
              </button>
            )}

            <button
              onClick={onClearFilters}
              className="rounded-full px-3 py-2 text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--clay)', height: 42 }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ArtworksPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search + filters
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const [filterStyle, setFilterStyle] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artworksData, auctionsData] = await Promise.all([
        getAllArtworks(),
        getAllAuctions(),
      ]);
      setArtworks(artworksData);
      setAuctions(auctionsData);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load artworks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Not in ANY auction
  const purchasableArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
      const inAuction = auctions.some((a) => a.artworkId === artwork.id);
      return !inAuction && artwork.price && artwork.status === 'available';
    });
  }, [artworks, auctions]);

  const styles = useMemo(
    () => [...new Set(purchasableArtworks.map((a) => a.style).filter(Boolean))],
    [purchasableArtworks]
  );
  const mediums = useMemo(
    () => [...new Set(purchasableArtworks.map((a) => a.medium).filter(Boolean))],
    [purchasableArtworks]
  );

  const handleSearch = () => {
    const prompt = (query || '').toLowerCase().trim();
    if (!prompt) {
      setSearchResults(null);
      return;
    }

    const priceMatch = prompt.match(/r\s?(\d+[\s,]?\d*)/i);
    const maxPrice = priceMatch ? parseFloat(priceMatch[1].replace(/[\s,]/g, '')) : null;

    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'want', 'looking',
      'find', 'show', 'give', 'under', 'price', 'zar'
    ]);

    const keywords = prompt
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const scored = purchasableArtworks.map((artwork) => {
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

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
  };

  const applyFilters = (list) =>
    list.filter((a) => {
      if (filterStyle && a.style !== filterStyle) return false;
      if (filterMedium && a.medium !== filterMedium) return false;
      if (filterMaxPrice && a.price > parseFloat(filterMaxPrice)) return false;
      if (filterAvailable && a.status !== 'available') return false;
      return true;
    });

  const displayArtworks = applyFilters(searchResults ?? purchasableArtworks);
  const hasResults = searchResults !== null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <FiltersBar
        styles={styles}
        mediums={mediums}
        query={query}
        setQuery={setQuery}
        onSubmitQuery={handleSearch}
        hasResults={hasResults}
        onClearSearch={clearSearch}
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

      <main className="py-16">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-16">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--clay)' }}
              />
            </div>
          ) : error ? (
            <div
              className="rounded-xl border p-6"
              style={{
                background: 'rgba(140, 90, 60, 0.06)',
                borderColor: 'var(--clay)',
                color: 'var(--text-primary)',
              }}
            >
              <p>{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 rounded-full px-5 py-2 text-sm font-semibold"
                style={{ background: 'var(--clay)', color: '#F5EFE6' }}
              >
                Try Again
              </button>
            </div>
          ) : displayArtworks.length === 0 ? (
            <div className="py-24 text-center">
              <h3 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                No matches
              </h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                Try clearing filters or searching different keywords.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                Showing {displayArtworks.length} result{displayArtworks.length !== 1 ? 's' : ''}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayArtworks.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}