'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllAuctions } from '@/lib/firestore';
import { getAuctionStatus, updateAuctionStatusIfNeeded } from '@/lib/auctionHelpers';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, live, upcoming, ended

  // ---------- Helpers ----------
  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price ?? 0);

  const formatDateTime = (value) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return '';
    }
  };

  const badge = (status) => {
    const map = {
      live: { label: 'Live', bg: 'rgba(190, 58, 38, 0.14)', fg: '#8b2d1f', bd: 'rgba(190, 58, 38, 0.22)' },
      upcoming: { label: 'Upcoming', bg: 'rgba(167, 107, 17, 0.18)', fg: '#7b4f0e', bd: 'rgba(167, 107, 17, 0.24)' },
      ended: { label: 'Ended', bg: 'rgba(111, 102, 94, 0.16)', fg: 'rgba(46, 42, 39, 0.80)', bd: 'rgba(111, 102, 94, 0.22)' },
      completed: { label: 'Completed', bg: 'rgba(24, 74, 52, 0.12)', fg: 'rgba(24, 74, 52, 0.9)', bd: 'rgba(24, 74, 52, 0.20)' },
    };

    const v = map[status] || map.ended;

    return (
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
        style={{
          background: v.bg,
          color: v.fg,
          border: `1px solid ${v.bd}`,
        }}
      >
        {status === 'live' ? '🔴 ' : status === 'upcoming' ? '📅 ' : status === 'ended' ? '⏹️ ' : '✅ '}
        {v.label}
      </span>
    );
  };

  // ---------- Fetch ----------
  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const data = await getAllAuctions();

      // compute correct statuses immediately for UI
      const withStatus = data.map((a) => ({ ...a, status: getAuctionStatus(a) }));
      setAuctions(withStatus);

      // update db in background if needed
      for (const a of withStatus) {
        const original = data.find((x) => x.id === a.id);
        if (original && original.status !== a.status) {
          updateAuctionStatusIfNeeded(a.id, a);
        }
      }

      setError('');
    } catch (err) {
      console.error('Error fetching auctions:', err);
      setError('Failed to load auctions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // ---------- Status poll (safe) ----------
  useEffect(() => {
    if (!auctions.length) return;

    const interval = setInterval(async () => {
      // IMPORTANT: use functional setState so we always read the freshest auctions
      setAuctions((prev) => {
        // kick off async DB updates without blocking UI
        (async () => {
          await Promise.all(
            prev.map(async (auction) => {
              const correct = getAuctionStatus(auction);
              if (correct !== auction.status) {
                await updateAuctionStatusIfNeeded(auction.id, { ...auction, status: correct });
              }
            })
          );
        })();

        // update UI immediately
        return prev.map((auction) => ({
          ...auction,
          status: getAuctionStatus(auction),
        }));
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [auctions.length]);

  // ---------- Filtered list ----------
  const filteredAuctions = useMemo(() => {
    return auctions.filter((a) => (filter === 'all' ? true : a.status === filter));
  }, [auctions, filter]);

  const counts = useMemo(() => {
    const c = { all: auctions.length, live: 0, upcoming: 0, ended: 0 };
    for (const a of auctions) {
      if (a.status === 'live') c.live++;
      if (a.status === 'upcoming') c.upcoming++;
      if (a.status === 'ended') c.ended++;
    }
    return c;
  }, [auctions]);

  // ---------- UI ----------
  const Chip = ({ value, label, count }) => {
    const active = filter === value;
    return (
      <button
        onClick={() => setFilter(value)}
        className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
        style={{
          border: `1px solid ${active ? 'rgba(140, 90, 60, 0.45)' : 'var(--border)'}`,
          background: active ? 'rgba(140, 90, 60, 0.10)' : 'rgba(255,255,255,0.55)',
          color: active ? 'var(--clay)' : 'var(--text-primary)',
        }}
        type="button"
      >
        {label}
        <span
          className="ml-2 rounded-full px-2 py-0.5 text-xs"
          style={{
            background: 'rgba(46, 42, 39, 0.06)',
            color: 'var(--text-muted)',
            border: `1px solid var(--border)`,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen py-12" style={{ background: '#fff' }}>
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            Art Auctions
          </h1>
          <p className="mt-2 text-base md:text-lg" style={{ color: 'var(--text-muted)' }}>
            Participate in live auctions and bid on artworks that move you.
          </p>
        </div>

        {/* Filter chips */}
        <div className="mb-10 flex flex-wrap gap-3">
          <Chip value="all" label="All" count={counts.all} />
          <Chip value="live" label="🔴 Live" count={counts.live} />
          <Chip value="upcoming" label="📅 Upcoming" count={counts.upcoming} />
          <Chip value="ended" label="⏹️ Ended" count={counts.ended} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div
              className="h-12 w-12 animate-spin rounded-full border-2"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--clay)' }}
            />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="rounded-xl border p-6"
            style={{ borderColor: 'rgba(190, 58, 38, 0.25)', background: 'rgba(190, 58, 38, 0.08)' }}
          >
            <p style={{ color: '#8b2d1f' }}>{error}</p>
            <button
              onClick={fetchAuctions}
              className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: '#8b2d1f', color: '#F5EFE6' }}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredAuctions.length === 0 && (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.55)' }}
          >
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              No {filter !== 'all' ? filter : ''} auctions yet
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              {filter === 'live'
                ? 'There are no live auctions right now. Check back soon.'
                : 'Check back later for upcoming auctions.'}
            </p>

            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-6 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
                style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                type="button"
              >
                View all auctions
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filteredAuctions.length > 0 && (
          <>
            <div className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {filteredAuctions.length}{' '}
              {filter !== 'all' ? filter : ''} {filteredAuctions.length === 1 ? 'auction' : 'auctions'}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAuctions.map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`} className="group block">
                  <div
                    className="overflow-hidden rounded-2xl border transition-shadow duration-300"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'rgba(255,255,255,0.55)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Artwork Auction
                          </h3>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            ID: {auction.id?.substring(0, 8)}...
                          </p>
                        </div>
                        {badge(auction.status)}
                      </div>

                      {/* Bid box */}
                      <div
                        className="mt-5 rounded-xl border p-4"
                        style={{
                          borderColor: 'var(--border)',
                          background: 'rgba(232, 216, 195, 0.35)',
                        }}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Current bid
                        </div>
                        <div className="mt-1 font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                          {formatPrice(auction.currentBid)}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {auction.bidCount || 0} {auction.bidCount === 1 ? 'bid' : 'bids'}
                        </div>
                      </div>

                      {/* Timing */}
                      <div className="mt-4 space-y-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {auction.status === 'live' && (
                          <div>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              Ends:{' '}
                            </span>
                            {formatDateTime(auction.endTime)}
                          </div>
                        )}
                        {auction.status === 'upcoming' && (
                          <div>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              Starts:{' '}
                            </span>
                            {formatDateTime(auction.startTime)}
                          </div>
                        )}
                        {auction.status === 'ended' && auction.winnerId && (
                          <div style={{ color: 'rgba(24, 74, 52, 0.95)' }}>
                            <span className="font-semibold">Winner:</span> {auction.winnerId.substring(0, 8)}...
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="mt-6">
                        <div
                          className="rounded-full px-5 py-3 text-center text-sm font-semibold transition-all group-hover:brightness-110"
                          style={{
                            background: auction.status === 'live' ? 'rgba(190, 58, 38, 0.90)' : 'var(--clay)',
                            color: '#F5EFE6',
                          }}
                        >
                          {auction.status === 'live' ? 'View auction' : 'View details'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}