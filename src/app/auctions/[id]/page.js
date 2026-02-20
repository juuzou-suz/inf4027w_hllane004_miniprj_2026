'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getArtworkById } from '@/lib/firestore';
import Link from 'next/link';

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const auctionId = params.id;

  const [auction, setAuction] = useState(null);
  const [artwork, setArtwork] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  // Fetch auction + artwork
  useEffect(() => {
    if (auctionId) fetchAuctionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  // Real-time bids
  useEffect(() => {
    if (!auctionId) return;

    const bidsQuery = query(
      collection(db, 'bids'),
      where('auctionId', '==', auctionId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(bidsQuery, (snapshot) => {
      const bidsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBids(bidsData);
    });

    return () => unsubscribe();
  }, [auctionId]);

  // Real-time auction
  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = onSnapshot(doc(db, 'auctions', auctionId), (snap) => {
      if (snap.exists()) setAuction({ id: snap.id, ...snap.data() });
    });

    return () => unsubscribe();
  }, [auctionId]);

  const fetchAuctionData = async () => {
    try {
      setLoading(true);

      const auctionDoc = await getDoc(doc(db, 'auctions', auctionId));
      if (!auctionDoc.exists()) {
        setError('Auction not found');
        setLoading(false);
        return;
      }

      const auctionData = { id: auctionDoc.id, ...auctionDoc.data() };
      setAuction(auctionData);

      const artworkData = await getArtworkById(auctionData.artworkId);
      setArtwork(artworkData);

      setError('');
    } catch (err) {
      console.error('Error fetching auction:', err);
      setError('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price || 0);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-ZA');
  };

  const getTimeRemaining = () => {
    if (!auction?.endTime) return 'N/A';
    const end = new Date(auction.endTime);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  useEffect(() => {
    const interval = setInterval(() => setTimeRemaining(getTimeRemaining()), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction]);

  const statusBadge = useMemo(() => {
    const base = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold';
    if (!auction?.status) return <span className={base} style={{ borderColor: 'var(--border)' }}>Status</span>;

    if (auction.status === 'live') {
      return (
        <span
          className={base}
          style={{
            borderColor: 'rgba(190, 58, 38, 0.25)',
            background: 'rgba(190, 58, 38, 0.10)',
            color: 'var(--text-primary)',
          }}
        >
          🔴 Live
        </span>
      );
    }

    if (auction.status === 'upcoming') {
      return (
        <span
          className={base}
          style={{
            borderColor: 'rgba(167, 107, 17, 0.25)',
            background: 'rgba(167, 107, 17, 0.10)',
            color: 'var(--text-primary)',
          }}
        >
          📅 Upcoming
        </span>
      );
    }

    return (
      <span
        className={base}
        style={{
          borderColor: 'rgba(111, 102, 94, 0.35)',
          background: 'rgba(111, 102, 94, 0.10)',
          color: 'var(--text-primary)',
        }}
      >
        ⏹️ Ended
      </span>
    );
  }, [auction?.status]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?redirect=/auctions/${auctionId}`);
      return;
    }

    setError('');
    setBidding(true);

    try {
      const amount = parseFloat(bidAmount);

      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid bid amount');
        return;
      }

      if (!auction) {
        setError('Auction data not ready');
        return;
      }

      if (auction.status !== 'live') {
        setError('This auction is not currently live');
        return;
      }

      if (amount <= auction.currentBid) {
        setError(`Bid must be higher than current bid of ${formatPrice(auction.currentBid)}`);
        return;
      }

      const minAllowed = (auction.currentBid || 0) + (auction.minimumIncrement || 0);
      if (amount < minAllowed) {
        setError(`Bid must be at least ${formatPrice(minAllowed)}`);
        return;
      }

      if (auction.currentBidderId === user.uid) {
        setError('You are already the highest bidder');
        return;
      }

      await addDoc(collection(db, 'bids'), {
        auctionId,
        artworkId: auction.artworkId,
        userId: user.uid,
        userEmail: user.email,
        amount,
        timestamp: serverTimestamp(),
        isWinning: true,
        isOutbid: false,
      });

      await updateDoc(doc(db, 'auctions', auctionId), {
        currentBid: amount,
        currentBidderId: user.uid,
        bidCount: (auction.bidCount || 0) + 1,
      });

      setBidAmount('');
      setError('');
    } catch (err) {
      console.error('Error placing bid:', err);
      setError('Failed to place bid. Please try again.');
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div
          className="h-12 w-12 animate-spin rounded-full border-2"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--clay)' }}
        />
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="min-h-screen py-10" style={{ background: 'var(--background)' }}>
        <div className="container">
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              borderColor: 'rgba(190, 58, 38, 0.25)',
              background: 'rgba(190, 58, 38, 0.08)',
            }}
          >
            <h2 className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {error}
            </h2>
            <Link
              href="/auctions"
              className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: 'var(--clay)', color: '#F5EFE6' }}
            >
              Back to auctions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const minBid = (auction?.currentBid || 0) + (auction?.minimumIncrement || 0);

  return (
    <div className="min-h-screen py-10" style={{ background: 'var(--background)' }}>
      <div className="container">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--border)', background: 'rgba(245,239,230,0.55)' }}
          >
            ←
          </span>
          Back
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artwork image */}
            {artwork && (
              <div
                className="overflow-hidden rounded-2xl border"
                style={{
                  borderColor: 'var(--border)',
                  background: 'rgba(245, 239, 230, 0.55)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Artwork details */}
            {artwork && (
              <div
                className="rounded-2xl border p-6"
                style={{
                  borderColor: 'var(--border)',
                  background: 'rgba(245, 239, 230, 0.65)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h2 className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {artwork.title}
                </h2>
                <p className="mt-1 text-base" style={{ color: 'var(--text-muted)' }}>
                  by <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{artwork.artist}</span>
                </p>

                {artwork.description && (
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {artwork.description}
                  </p>
                )}

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2" style={{ color: 'var(--text-primary)' }}>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(212,197,185,0.75)', background: 'rgba(255,255,255,0.45)' }}>
                    <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Style
                    </span>
                    <div className="mt-1 font-semibold">{artwork.style || '—'}</div>
                  </div>

                  <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(212,197,185,0.75)', background: 'rgba(255,255,255,0.45)' }}>
                    <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Medium
                    </span>
                    <div className="mt-1 font-semibold">{artwork.medium || '—'}</div>
                  </div>

                  {artwork.dimensions && (
                    <div className="rounded-xl border p-3 sm:col-span-2" style={{ borderColor: 'rgba(212,197,185,0.75)', background: 'rgba(255,255,255,0.45)' }}>
                      <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        Size
                      </span>
                      <div className="mt-1 font-semibold">
                        {artwork.dimensions.width} × {artwork.dimensions.height} cm
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bid history */}
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: 'var(--border)',
                background: 'rgba(245, 239, 230, 0.65)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-end justify-between gap-4">
                <h3 className="font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  Bid history
                </h3>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {bids.length} bid{bids.length === 1 ? '' : 's'}
                </span>
              </div>

              {bids.length === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No bids yet. Be the first to bid.
                </p>
              ) : (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
                  {bids.map((bid, index) => {
                    const isTop = index === 0;
                    return (
                      <div
                        key={bid.id}
                        className="rounded-xl border p-4"
                        style={{
                          borderColor: isTop ? 'rgba(140, 90, 60, 0.35)' : 'rgba(212,197,185,0.75)',
                          background: isTop ? 'rgba(140, 90, 60, 0.08)' : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {formatPrice(bid.amount)}
                              {isTop && (
                                <span
                                  className="ml-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                                  style={{
                                    borderColor: 'rgba(140, 90, 60, 0.35)',
                                    background: 'rgba(140, 90, 60, 0.10)',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  Current highest
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {bid.userEmail}
                            </div>
                          </div>

                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatTime(bid.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-1">
            <div
              className="sticky top-6 rounded-2xl border p-6"
              style={{
                borderColor: 'var(--border)',
                background: 'rgba(245, 239, 230, 0.70)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-center justify-between">
                {statusBadge}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {auction?.bidCount || 0} bid{(auction?.bidCount || 0) === 1 ? '' : 's'}
                </span>
              </div>

              {/* Current bid */}
              <div className="mt-5">
                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Current bid
                </div>
                <div className="mt-1 font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {formatPrice(auction?.currentBid)}
                </div>
              </div>

              {/* Time remaining */}
              {auction?.status === 'live' && (
                <div
                  className="mt-5 rounded-2xl border p-4"
                  style={{
                    borderColor: 'rgba(190, 58, 38, 0.25)',
                    background: 'rgba(190, 58, 38, 0.08)',
                  }}
                >
                  <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Time remaining
                  </div>
                  <div className="mt-1 font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {timeRemaining}
                  </div>
                </div>
              )}

              {/* Times / increment */}
              <div className="mt-5 space-y-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <div className="flex items-start justify-between gap-4">
                  <span style={{ color: 'var(--text-muted)' }}>Starts</span>
                  <span className="text-right font-semibold">{new Date(auction.startTime).toLocaleString('en-ZA')}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span style={{ color: 'var(--text-muted)' }}>Ends</span>
                  <span className="text-right font-semibold">{new Date(auction.endTime).toLocaleString('en-ZA')}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span style={{ color: 'var(--text-muted)' }}>Min increment</span>
                  <span className="text-right font-semibold">{formatPrice(auction.minimumIncrement)}</span>
                </div>
              </div>

              {/* Bid panel */}
              <div className="mt-6">
                {auction?.status === 'live' && (
                  <>
                    {error && (
                      <div
                        className="mb-4 rounded-xl border px-3 py-2 text-sm"
                        style={{
                          borderColor: 'rgba(190, 58, 38, 0.25)',
                          background: 'rgba(190, 58, 38, 0.08)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {error}
                      </div>
                    )}

                    {user ? (
                      <form onSubmit={handlePlaceBid} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-widest"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Your bid (ZAR)
                          </label>
                          <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={minBid}
                            step={auction.minimumIncrement}
                            placeholder={`Min: ${formatPrice(minBid)}`}
                            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                            style={{
                              borderColor: 'var(--border)',
                              background: '#fff',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={bidding}
                          className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-60"
                          style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                        >
                          {bidding ? 'Placing bid…' : 'Place bid'}
                        </button>
                      </form>
                    ) : (
                      <Link
                        href={`/login?redirect=/auctions/${auctionId}`}
                        className="block w-full rounded-full px-6 py-3 text-center text-sm font-semibold transition-all hover:brightness-110"
                        style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                      >
                        Log in to bid
                      </Link>
                    )}
                  </>
                )}

                {auction?.status === 'upcoming' && (
                  <div
                    className="rounded-2xl border p-4 text-center"
                    style={{
                      borderColor: 'rgba(167, 107, 17, 0.25)',
                      background: 'rgba(167, 107, 17, 0.10)',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Auction starts
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(auction.startTime).toLocaleString('en-ZA')}
                    </p>
                  </div>
                )}

                {auction?.status === 'ended' && (
                  <div
                    className="rounded-2xl border p-4 text-center"
                    style={{
                      borderColor: 'rgba(111, 102, 94, 0.30)',
                      background: 'rgba(111, 102, 94, 0.08)',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Auction ended
                    </p>
                    {auction.winnerId && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Winning bid: {formatPrice(auction.currentBid)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/auctions"
                className="mt-6 block text-center text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                Back to auctions list
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}