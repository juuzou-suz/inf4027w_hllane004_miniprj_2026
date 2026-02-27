'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllAuctions } from '@/lib/firestore';
import { getAuctionStatus, updateAuctionStatusIfNeeded } from '@/lib/auctionHelpers';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, live, upcoming, ended, cancelled

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
      live: {
        label: 'Live',
        bg: 'rgba(190, 58, 38, 0.20)',
        fg: 'rgba(255, 225, 225, 0.95)',
        bd: 'rgba(255, 120, 120, 0.30)',
        icon: '🔴',
      },
      upcoming: {
        label: 'Upcoming',
        bg: 'rgba(255, 200, 120, 0.14)',
        fg: 'rgba(255, 235, 205, 0.95)',
        bd: 'rgba(255, 200, 120, 0.28)',
        icon: '📅',
      },
      ended: {
        label: 'Ended',
        bg: 'rgba(255, 255, 255, 0.06)',
        fg: 'rgba(245, 239, 230, 0.90)',
        bd: 'rgba(255, 255, 255, 0.10)',
        icon: '⏹️',
      },
      cancelled: {
        label: 'Cancelled',
        bg: 'rgba(190, 58, 38, 0.12)',
        fg: 'rgba(255, 180, 180, 0.95)',
        bd: 'rgba(255, 120, 120, 0.25)',
        icon: '❌',
      },
      completed: {
        label: 'Completed',
        bg: 'rgba(190, 255, 210, 0.12)',
        fg: 'rgba(210, 255, 230, 0.95)',
        bd: 'rgba(190, 255, 210, 0.25)',
        icon: '✅',
      },
    };

    const v = map[status] || map.ended;

    return (
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap border"
        style={{ background: v.bg, color: v.fg, borderColor: v.bd }}
      >
        {v.icon} {v.label}
      </span>
    );
  };

  // ---------- Fetch ----------
  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const data = await getAllAuctions();

      // Compute correct statuses immediately for UI
      // Don't override "cancelled" status - respect it if set by admin
      const withStatus = data.map((a) => {
        if (a.status === 'cancelled') {
          return { ...a, status: 'cancelled' };
        }
        return { ...a, status: getAuctionStatus(a) };
      });
      
      setAuctions(withStatus);

      // Update db if needed (but never change cancelled to something else)
      for (const a of withStatus) {
        const original = data.find((x) => x.id === a.id);
        if (original && original.status !== a.status && original.status !== 'cancelled') {
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

    const interval = setInterval(() => {
      setAuctions((prev) => {
        (async () => {
          await Promise.all(
            prev.map(async (auction) => {
              // Never change status of cancelled auctions
              if (auction.status === 'cancelled') return;
              
              const correct = getAuctionStatus(auction);
              if (correct !== auction.status) {
                await updateAuctionStatusIfNeeded(auction.id, { ...auction, status: correct });
              }
            })
          );
        })();

        return prev.map((auction) => {
          // Keep cancelled status
          if (auction.status === 'cancelled') return auction;
          
          return {
            ...auction,
            status: getAuctionStatus(auction),
          };
        });
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [auctions.length]);

  // ---------- Filtered list ----------
  const filteredAuctions = useMemo(() => {
    return auctions.filter((a) => (filter === 'all' ? true : a.status === filter));
  }, [auctions, filter]);

  const counts = useMemo(() => {
    const c = { all: auctions.length, live: 0, upcoming: 0, ended: 0, cancelled: 0 };
    for (const a of auctions) {
      if (a.status === 'live') c.live++;
      if (a.status === 'upcoming') c.upcoming++;
      if (a.status === 'ended') c.ended++;
      if (a.status === 'cancelled') c.cancelled++;
    }
    return c;
  }, [auctions]);

  // ---------- UI ----------
  const Chip = ({ value, label, count }) => {
    const active = filter === value;

    return (
      <button
        onClick={() => setFilter(value)}
        className="rounded-full px-4 py-2 text-sm font-semibold transition-all border"
        style={{
          borderColor: active ? 'rgba(160,106,75,0.55)' : 'rgba(255,255,255,0.10)',
          background: active ? 'rgba(160,106,75,0.12)' : 'rgba(255,255,255,0.04)',
          color: active ? 'var(--clay)' : 'var(--text-primary)',
        }}
        type="button"
      >
        {label}
        <span
          className="ml-2 rounded-full px-2 py-0.5 text-xs border"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-muted)',
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen py-12 bg-background text-foreground">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black">Art Auctions</h1>
          <p className="mt-2 text-base md:text-lg text-muted-foreground">
            Participate in live auctions and bid on artworks that move you.
          </p>
        </div>

        {/* Filter chips */}
        <div className="mb-10 flex flex-wrap gap-3">
          <Chip value="all" label="All" count={counts.all} />
          <Chip value="live" label="🔴 Live" count={counts.live} />
          <Chip value="upcoming" label="📅 Upcoming" count={counts.upcoming} />
          <Chip value="ended" label="⏹️ Ended" count={counts.ended} />
          <Chip value="cancelled" label="❌ Cancelled" count={counts.cancelled} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] p-6">
            <p className="text-[rgba(255,225,225,0.95)]">{error}</p>
            <button
              onClick={fetchAuctions}
              className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110
                         bg-primary text-primary-foreground"
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredAuctions.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="font-display text-2xl font-black">
              No {filter !== 'all' ? filter : ''} auctions yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === 'live'
                ? 'There are no live auctions right now. Check back soon.'
                : filter === 'cancelled'
                ? 'No cancelled auctions to show.'
                : 'Check back later for upcoming auctions.'}
            </p>

            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-6 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110
                           bg-primary text-primary-foreground"
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
            <div className="mb-6 text-sm text-muted-foreground">
              Showing {filteredAuctions.length}{' '}
              {filter !== 'all' ? filter : ''} {filteredAuctions.length === 1 ? 'auction' : 'auctions'}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAuctions.map((auction) => (
                <Link key={auction.id} href={`/auctions/${auction.id}`} className="group block">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            Artwork Auction
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            ID: {auction.id?.substring(0, 8)}...
                          </p>
                        </div>
                        {badge(auction.status)}
                      </div>

                      {/* Bid box - only show if not cancelled */}
                      {auction.status !== 'cancelled' && (
                        <div className="mt-5 rounded-2xl border border-border p-4 bg-[rgba(255,255,255,0.04)]">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Current bid
                          </div>
                          <div className="mt-1 font-display text-2xl font-black text-foreground">
                            {formatPrice(auction.currentBid)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {auction.bidCount || 0} {auction.bidCount === 1 ? 'bid' : 'bids'}
                          </div>
                        </div>
                      )}

                      {/* Cancelled message */}
                      {auction.status === 'cancelled' && (
                        <div className="mt-5 rounded-2xl border p-4" style={{
                          borderColor: 'rgba(255,120,120,0.25)',
                          background: 'rgba(190,58,38,0.12)'
                        }}>
                          <p className="text-sm font-semibold" style={{ color: 'rgba(255,180,180,0.95)' }}>
                            This auction has been cancelled
                          </p>
                          {auction.cancellationReason && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {auction.cancellationReason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Timing */}
                      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                        {auction.status === 'live' && (
                          <div>
                            <span className="font-semibold text-foreground">Ends: </span>
                            {formatDateTime(auction.endTime)}
                          </div>
                        )}
                        {auction.status === 'upcoming' && (
                          <div>
                            <span className="font-semibold text-foreground">Starts: </span>
                            {formatDateTime(auction.startTime)}
                          </div>
                        )}
                        {auction.status === 'ended' && auction.winnerId && (
                          <div className="text-[rgba(210,255,230,0.95)]">
                            <span className="font-semibold">Winner:</span> {auction.winnerId.substring(0, 8)}...
                          </div>
                        )}
                        {auction.status === 'cancelled' && (
                          <div style={{ color: 'rgba(255,180,180,0.95)' }}>
                            <span className="font-semibold">Cancelled</span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="mt-6">
                        <div
                          className="rounded-full px-5 py-3 text-center text-sm font-semibold transition-all group-hover:brightness-110"
                          style={{
                            background: auction.status === 'live' 
                              ? 'rgba(190, 58, 38, 0.90)' 
                              : auction.status === 'cancelled'
                              ? 'rgba(255,255,255,0.10)'
                              : 'var(--clay)',
                            color: '#F5EFE6',
                          }}
                        >
                          {auction.status === 'live' 
                            ? 'View auction' 
                            : auction.status === 'cancelled'
                            ? 'View details'
                            : 'View details'}
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