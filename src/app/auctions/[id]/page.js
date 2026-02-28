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
import { getAuctionStatus } from '@/lib/auctionHelpers';
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

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const realStatus = useMemo(() => {
    if (!auction) return null;
    // If auction is cancelled, always return cancelled
    if (auction.status === 'cancelled') return 'cancelled';
    return getAuctionStatus(auction);
  }, [auction, now]);

  useEffect(() => {
    if (!auctionId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const auctionDoc = await getDoc(doc(db, 'auctions', auctionId));
        if (!auctionDoc.exists()) {
          setError('Auction not found');
          return;
        }
        const auctionData = { id: auctionDoc.id, ...auctionDoc.data() };
        setAuction(auctionData);

        const artworkData = await getArtworkById(auctionData.artworkId);
        setArtwork(artworkData);
      } catch (err) {
        console.error('Error fetching auction:', err);
        setError('Failed to load auction details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auctionId]);

  useEffect(() => {
    if (!auctionId) return;
    const unsubscribe = onSnapshot(doc(db, 'auctions', auctionId), (snap) => {
      if (snap.exists()) setAuction({ id: snap.id, ...snap.data() });
    });
    return () => unsubscribe();
  }, [auctionId]);

  useEffect(() => {
    if (!auctionId) return;
    const bidsQuery = query(
      collection(db, 'bids'),
      where('auctionId', '==', auctionId),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(bidsQuery, (snapshot) => {
      setBids(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [auctionId]);

  useEffect(() => {
    if (!auction || !auctionId || !realStatus) return;
    // Don't update if already cancelled
    if (auction.status === 'cancelled') return;
    if (realStatus === auction.status) return;

    updateDoc(doc(db, 'auctions', auctionId), { status: realStatus }).catch(console.error);

    if (realStatus === 'ended' && auction.currentBidderId && !auction.winnerId) {
      updateDoc(doc(db, 'auctions', auctionId), {
        status: 'ended',
        winnerId: auction.currentBidderId,
        winnerEmail: auction.currentBidderEmail || null,
        winningBid: auction.currentBid,
      }).catch(console.error);
    }
  }, [realStatus, auction, auctionId]);

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

  const timeRemaining = useMemo(() => {
    if (!auction?.endTime) return 'N/A';
    const end = new Date(auction.endTime);
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [auction?.endTime, now]);

  const statusBadge = useMemo(() => {
    const base = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold';

    if (!realStatus) return <span className={base + ' border-border text-muted-foreground'}>Status</span>;

    if (realStatus === 'cancelled') {
      return (
        <span
          className={base}
          style={{
            borderColor: 'rgba(255,120,120,0.25)',
            background: 'rgba(190,58,38,0.12)',
            color: 'rgba(255,180,180,0.95)',
          }}
        >
          ❌ Cancelled
        </span>
      );
    }

    if (realStatus === 'live') {
      return (
        <span
          className={base}
          style={{
            borderColor: 'rgba(255,120,120,0.30)',
            background: 'rgba(190,58,38,0.18)',
            color: 'rgba(255,225,225,0.95)',
          }}
        >
          🔴 Live
        </span>
      );
    }

    if (realStatus === 'upcoming') {
      return (
        <span
          className={base}
          style={{
            borderColor: 'rgba(255,200,120,0.28)',
            background: 'rgba(255,200,120,0.14)',
            color: 'rgba(255,235,205,0.95)',
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
          borderColor: 'rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(245,239,230,0.90)',
        }}
      >
        ⏹️ Ended
      </span>
    );
  }, [realStatus]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?redirect=/auctions/${auctionId}`);
      return;
    }

    if (realStatus !== 'live') {
      setError('This auction is not currently live');
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
        currentBidderEmail: user.email,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="min-h-screen bg-background py-10 text-foreground">
        <div className="container">
          <div className="rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] p-8 text-center">
            <h2 className="font-display text-2xl font-black text-[rgba(255,225,225,0.95)]">{error}</h2>
            <Link
              href="/auctions"
              className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110 bg-primary text-primary-foreground"
            >
              Back to auctions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const minBid = (auction?.currentBid || 0) + (auction?.minimumIncrement || 0);
  const isEnded = realStatus === 'ended';
  const isCancelled = realStatus === 'cancelled';
  const winnerId = auction?.winnerId || (isEnded ? auction?.currentBidderId : null);
  const winnerEmail = auction?.winnerEmail || auction?.currentBidderEmail || null;
  const isWinner = user && winnerId === user.uid;

  return (
    <div className="min-h-screen bg-background py-10 text-foreground">
      <div className="container">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80 text-muted-foreground"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card">
            ←
          </span>
          Back
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artwork image */}
            {artwork && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                <div className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
                  <img src={artwork.imageUrl} alt={artwork.title} className="h-full w-full object-cover" />
                </div>
              </div>
            )}

            {/* Artwork details */}
            {artwork && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
                <h2 className="font-display text-3xl font-black">{artwork.title}</h2>
                <p className="mt-1 text-base text-muted-foreground">
                  by <span className="font-semibold text-foreground">{artwork.artist}</span>
                </p>
                {artwork.description && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{artwork.description}</p>
                )}
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <MiniStat label="Style" value={artwork.style || '—'} />
                  <MiniStat label="Medium" value={artwork.medium || '—'} />
                  {artwork.dimensions && (
                    <MiniStat
                      label="Size"
                      value={`${artwork.dimensions.width} × ${artwork.dimensions.height} cm`}
                      full
                    />
                  )}
                </div>
              </div>
            )}

            {/* Ended with no bids */}
            {isEnded && !isCancelled && !winnerId && (
              <div
                className="rounded-2xl border p-6"
                style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
              >
                <p className="text-sm font-semibold text-foreground">Auction ended with no bids</p>
              </div>
            )}

            {/* Bid history */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-end justify-between gap-4">
                <h3 className="font-display text-xl font-black">Bid history</h3>
                <span className="text-xs text-muted-foreground">
                  {bids.length} bid{bids.length === 1 ? '' : 's'}
                </span>
              </div>

              {isCancelled && bids.length > 0 && (
                <div className="mt-4 rounded-xl border p-3" style={{
                  borderColor: 'rgba(255,120,120,0.25)',
                  background: 'rgba(190,58,38,0.08)'
                }}>
                  <p className="text-xs" style={{ color: 'rgba(255,180,180,0.95)' }}>
                    ⚠️ All bids have been voided due to auction cancellation
                  </p>
                </div>
              )}

              {bids.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No bids yet. Be the first to bid.</p>
              ) : (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
                  {bids.map((bid, index) => {
                    const isTop = index === 0 && !isCancelled;
                    return (
                      <div
                        key={bid.id}
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: isTop ? 'rgba(160,106,75,0.45)' : 'rgba(255,255,255,0.10)',
                          background: isTop ? 'rgba(160,106,75,0.10)' : 'rgba(255,255,255,0.04)',
                          opacity: isCancelled ? 0.5 : 1,
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-foreground">
                              {formatPrice(bid.amount)}
                              {isTop && (
                                <span
                                  className="ml-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                                  style={{
                                    borderColor: 'rgba(160,106,75,0.45)',
                                    background: 'rgba(160,106,75,0.12)',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  {isEnded ? 'Winning bid' : 'Current highest'}
                                </span>
                              )}
                              {isCancelled && index === 0 && (
                                <span
                                  className="ml-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                                  style={{
                                    borderColor: 'rgba(255,120,120,0.25)',
                                    background: 'rgba(190,58,38,0.12)',
                                    color: 'rgba(255,180,180,0.95)',
                                  }}
                                >
                                  Voided
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{bid.userEmail}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{formatTime(bid.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between">
                {statusBadge}
                <span className="text-xs text-muted-foreground">
                  {auction?.bidCount || 0} bid{(auction?.bidCount || 0) === 1 ? '' : 's'}
                </span>
              </div>

              {/* Current / final bid */}
              <div className="mt-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {isCancelled ? 'Last bid (voided)' : isEnded ? 'Final bid' : 'Current bid'}
                </div>
                <div className="mt-1 font-display text-3xl font-black text-foreground">
                  {formatPrice(auction?.currentBid)}
                </div>
              </div>

              {/* Time remaining — only when live */}
              {realStatus === 'live' && (
                <div
                  className="mt-5 rounded-2xl border p-4"
                  style={{ borderColor: 'rgba(255,120,120,0.30)', background: 'rgba(190,58,38,0.14)' }}
                >
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Time remaining</div>
                  <div className="mt-1 font-display text-2xl font-black text-[rgba(255,225,225,0.95)]">
                    {timeRemaining}
                  </div>
                </div>
              )}

              {/* Times / increment */}
              <div className="mt-5 space-y-2 text-sm">
                <Row label="Starts" value={new Date(auction.startTime).toLocaleString('en-ZA')} />
                <Row label="Ends" value={new Date(auction.endTime).toLocaleString('en-ZA')} />
                <Row label="Min increment" value={formatPrice(auction.minimumIncrement)} />
              </div>

              {/* Bid panel */}
              <div className="mt-6">
                {/* CANCELLED */}
                {isCancelled && (
                  <div
                    className="rounded-2xl border p-4 text-center"
                    style={{ borderColor: 'rgba(255,120,120,0.25)', background: 'rgba(190,58,38,0.12)' }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,180,180,0.95)' }}>
                      ❌ Auction Cancelled
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      This auction is no longer accepting bids
                    </p>
                  </div>
                )}

                {/* LIVE */}
                {realStatus === 'live' && (
                  <>
                    {error && (
                      <div className="mb-4 rounded-xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] px-3 py-2 text-sm text-[rgba(255,225,225,0.95)]">
                        {error}
                      </div>
                    )}

                    {user ? (
                      <form onSubmit={handlePlaceBid} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Your bid (ZAR)
                          </label>
                          <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={minBid}
                            step={auction.minimumIncrement}
                            placeholder={`Min: ${formatPrice(minBid)}`}
                            className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground/70"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={bidding}
                          className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-60 bg-primary text-primary-foreground"
                        >
                          {bidding ? 'Placing bid…' : 'Place bid'}
                        </button>
                      </form>
                    ) : (
                      <Link
                        href={`/login?redirect=/auctions/${auctionId}`}
                        className="block w-full rounded-full px-6 py-3 text-center text-sm font-semibold transition-all hover:brightness-110 bg-primary text-primary-foreground"
                      >
                        Log in to bid
                      </Link>
                    )}
                  </>
                )}

                {/* UPCOMING */}
                {realStatus === 'upcoming' && (
                  <div
                    className="rounded-2xl border p-4 text-center"
                    style={{ borderColor: 'rgba(255,200,120,0.28)', background: 'rgba(255,200,120,0.14)' }}
                  >
                    <p className="text-sm font-semibold text-foreground">Auction starts</p>
                    <p className="mt-1 text-sm text-muted-foreground">{new Date(auction.startTime).toLocaleString('en-ZA')}</p>
                  </div>
                )}

                {/* ENDED */}
                {isEnded && !isCancelled && (
                  <div
                    className="rounded-2xl border p-4 text-center"
                    style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-sm font-semibold text-foreground">Auction ended</p>
                    {winnerId ? (
                      <>
                        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Winner</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {isWinner ? '🏆 You!' : winnerEmail || 'Determined'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatPrice(auction.currentBid)}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">No bids were placed</p>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/auctions"
                className="mt-6 block text-center text-sm font-semibold transition-colors hover:opacity-80 text-muted-foreground"
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

function MiniStat({ label, value, full }) {
  return (
    <div
      className={['rounded-2xl border p-3', full ? 'sm:col-span-2' : ''].join(' ')}
      style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}
    >
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}