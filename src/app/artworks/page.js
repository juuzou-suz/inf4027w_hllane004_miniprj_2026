'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';
import ArtworkCard from '@/components/artworkCard';
import { parseSearchWithAI, basicKeywordSearch } from '@/lib/aiSearch';

function FiltersBar({
  styles,
  mediums,
  query,
  setQuery,
  onSubmitQuery,
  hasSearch,
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
    <section className="border-b border-border/60 py-6 bg-background/60 backdrop-blur-sm">
      <div className="container">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="font-display text-2xl font-black text-foreground">Browse artworks</h2>
          <p className="text-sm text-muted-foreground">Search and filter without the noise.</p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitQuery();
            }}
            className="flex items-center rounded-full shadow-sm w-full max-w-[420px] h-[42px]
                       border border-border bg-card"
          >
            <div className="flex flex-1 items-center px-4">
              <Search size={16} className="text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artworks..."
                className="ml-2 flex-1 bg-transparent text-sm outline-none text-foreground
                           placeholder:text-muted-foreground/70"
              />
            </div>

            <button
              type="submit"
              className="mr-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:brightness-110
                         bg-primary text-primary-foreground"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <select
              value={filterStyle}
              onChange={(e) => onFilterStyle(e.target.value)}
              className="h-[42px] rounded-md border border-border px-3 text-sm outline-none
                         bg-card text-foreground"
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
              className="h-[42px] rounded-md border border-border px-3 text-sm outline-none
                         bg-card text-foreground"
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
              className="h-[42px] w-28 rounded-md border border-border px-3 text-sm outline-none
                         bg-card text-foreground placeholder:text-muted-foreground/70"
            />

            {/* Optional toggle exists in state; if you later add UI, keep this style */}
            {/* Example:
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={filterAvailable}
                onChange={(e) => onFilterAvailable(e.target.checked)}
              />
              Available only
            </label>
            */}

            {hasSearch && (
              <button
                onClick={onClearSearch}
                className="h-[42px] flex items-center gap-1 rounded-full border border-border px-3 py-2
                           text-xs font-medium text-muted-foreground transition-colors hover:text-foreground
                           hover:bg-[rgba(255,255,255,0.06)]"
                type="button"
              >
                <X size={14} />
                Clear search
              </button>
            )}

            <button
              onClick={onClearFilters}
              className="h-[42px] rounded-full px-3 py-2 text-xs font-semibold
                         text-primary transition-colors hover:opacity-80"
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
  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const { addToCart } = useCart();

  const [filterStyle, setFilterStyle] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artworksData, auctionsData] = await Promise.all([getAllArtworks(), getAllAuctions()]);
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

  const handleSearch = async () => {
    const q = (query || '').trim();
    if (!q) {
      setSearchResults(null);
      return;
    }

    const { results, useBasicSearch } = await parseSearchWithAI(q, purchasableArtworks);

    if (useBasicSearch) {
      const basicResults = basicKeywordSearch(q, purchasableArtworks);
      setSearchResults(basicResults);
    } else {
      setSearchResults(results);
    }
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
  const hasSearch = searchResults !== null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FiltersBar
        styles={styles}
        mediums={mediums}
        query={query}
        setQuery={setQuery}
        onSubmitQuery={handleSearch}
        hasSearch={hasSearch}
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
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-[rgba(160,106,75,0.6)] bg-[rgba(160,106,75,0.10)] p-6 text-foreground">
              <p>{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 rounded-full px-5 py-2 text-sm font-semibold
                           bg-primary text-primary-foreground hover:brightness-110"
              >
                Try Again
              </button>
            </div>
          ) : displayArtworks.length === 0 ? (
            <div className="py-24 text-center">
              <h3 className="font-display text-2xl font-semibold text-foreground">No matches</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try clearing filters or searching different keywords.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-sm text-muted-foreground">
                Showing {displayArtworks.length} result{displayArtworks.length !== 1 ? 's' : ''}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayArtworks.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} onAddToCart={addToCart} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}