'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrdersByUser } from '@/lib/firestore';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Bids & Auctions
  const [bids, setBids] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    getOrdersByUser(user.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setOrdersLoading(false));

    const bidsQuery = query(
      collection(db, 'bids'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubBids = onSnapshot(bidsQuery, (snap) => {
      setBids(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBidsLoading(false);
    });

    const unsubAuctions = onSnapshot(collection(db, 'auctions'), (snap) => {
      setAuctions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubBids();
      unsubAuctions();
    };
  }, [user, router]);

  if (!user) return null;

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price || 0);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const paymentLabels = {
    credit_card: '💳 Card',
    paypal: '🅿️ PayPal',
    eft: '🏦 EFT',
    cash_on_delivery: '💵 Cash',
  };

  const getAuction = (auctionId) => auctions.find((a) => a.id === auctionId);
  const isWinning = (auctionId) => getAuction(auctionId)?.currentBidderId === user.uid;

  // Group bids by auction; keep latest per auction (bids are already ordered desc)
  const bidsByAuction = useMemo(() => {
    return bids.reduce((acc, bid) => {
      if (!acc[bid.auctionId]) acc[bid.auctionId] = bid;
      return acc;
    }, {});
  }, [bids]);

  const activeBids = useMemo(() => {
    return Object.values(bidsByAuction).filter((bid) => {
      const auction = getAuction(bid.auctionId);
      return auction && (auction.status === 'live' || auction.status === 'upcoming');
    });
  }, [bidsByAuction, auctions]);

  const wonAuctions = useMemo(() => {
    return auctions.filter((a) => a.status === 'ended' && a.winnerId === user.uid);
  }, [auctions, user.uid]);

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const tabs = [
    { id: 'orders', label: 'Order history', icon: '📦' },
    { id: 'bids', label: 'Active bids', icon: '⚡' },
    { id: 'won', label: 'Won auctions', icon: '🏆' },
  ];

  return (
    <div className="min-h-screen py-10" style={{ background: 'rgb(255, 255, 255)' }}>
      <div className="container">
        {/* Header card */}
        <section
          className="rounded-2xl border p-6 md:p-8"
          style={{
            background: 'rgba(232, 216, 195, 0.55)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border"
                style={{
                  background: 'rgba(245, 239, 230, 0.75)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="text-2xl">👤</span>
              </div>

              <div>
                <h1 className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                  {user.email}
                </h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Customer account
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div
              className="rounded-xl border p-4 text-center"
              style={{ background: 'rgba(245, 239, 230, 0.7)', borderColor: 'var(--border)' }}
            >
              <div className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {orders.length}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Orders
              </div>
            </div>

            <div
              className="rounded-xl border p-4 text-center"
              style={{ background: 'rgba(245, 239, 230, 0.7)', borderColor: 'var(--border)' }}
            >
              <div className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {wonAuctions.length}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Won auctions
              </div>
            </div>

            <div
              className="rounded-xl border p-4 text-center"
              style={{ background: 'rgba(245, 239, 230, 0.7)', borderColor: 'var(--border)' }}
            >
              <div className="font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {formatPrice(totalSpent)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Total spent
              </div>
            </div>
          </div>
        </section>

        {/* Tabs + content card */}
        <section
          className="mt-6 overflow-hidden rounded-2xl border"
          style={{
            background: 'rgba(245, 239, 230, 0.65)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex-1 px-4 py-4 text-sm font-semibold transition-colors"
                  style={{
                    color: active ? 'var(--clay)' : 'var(--text-muted)',
                    background: active ? 'rgba(140, 90, 60, 0.10)' : 'transparent',
                    borderBottom: active ? '2px solid var(--clay)' : '2px solid transparent',
                  }}
                >
                  <span className="mr-2">{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-5 md:p-6">
            {/* ── ORDERS ───────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  Order history
                </h2>

                {ordersLoading ? (
                  <div className="flex justify-center py-10">
                    <div
                      className="h-9 w-9 animate-spin rounded-full border-2"
                      style={{
                        borderColor: 'var(--border)',
                        borderTopColor: 'var(--clay)',
                      }}
                    />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-5xl">📦</div>
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      No orders yet.
                    </p>
                    <Link
                      href="/artworks"
                      className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
                      style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                    >
                      Browse artworks
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border p-5 transition-shadow hover:shadow-md"
                        style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.55)' }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              Order #{order.id?.substring(0, 8)}...
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <span
                            className="w-fit rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{
                              borderColor: 'rgba(24, 74, 52, 0.18)',
                              background: 'rgba(24, 74, 52, 0.08)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            ✅ {(order.status || 'paid').toUpperCase()}
                          </span>
                        </div>

                        {/* Thumbnails */}
                        {order.items?.length > 0 && (
                          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex-shrink-0">
                                <img
                                  src={item.imageUrl || 'https://via.placeholder.com/60x60'}
                                  alt={item.title || 'Artwork'}
                                  className="h-14 w-14 rounded-xl object-cover"
                                />
                                <p
                                  className="mt-1 w-14 truncate text-xs"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {item.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(212, 197, 185, 0.65)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {order.itemCount || order.items?.length || 0} item
                            {(order.itemCount || order.items?.length || 0) !== 1 ? 's' : ''} ·{' '}
                            {paymentLabels[order.paymentMethod] || order.paymentMethod || '—'}
                          </span>

                          <span className="font-display text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE BIDS ───────────────────────────────────────── */}
            {activeTab === 'bids' && (
              <div>
                <h2 className="font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  Active auction bids
                </h2>

                {bidsLoading ? (
                  <div className="flex justify-center py-10">
                    <div
                      className="h-9 w-9 animate-spin rounded-full border-2"
                      style={{
                        borderColor: 'var(--border)',
                        borderTopColor: 'var(--clay)',
                      }}
                    />
                  </div>
                ) : activeBids.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-5xl">⚡</div>
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      No active bids.
                    </p>
                    <Link
                      href="/auctions"
                      className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
                      style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                    >
                      Browse auctions
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {activeBids.map((bid) => {
                      const auction = getAuction(bid.auctionId);
                      const winning = isWinning(bid.auctionId);

                      return (
                        <div
                          key={bid.auctionId}
                          className="rounded-2xl border p-5"
                          style={{
                            borderColor: winning ? 'rgba(24, 74, 52, 0.28)' : 'rgba(140, 90, 60, 0.28)',
                            background: winning ? 'rgba(24, 74, 52, 0.08)' : 'rgba(140, 90, 60, 0.08)',
                          }}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Auction #{bid.auctionId?.substring(0, 8)}...
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Status: {auction?.status || '—'}
                              </p>
                            </div>

                            <span
                              className="w-fit rounded-full border px-3 py-1 text-xs font-semibold"
                              style={{
                                borderColor: winning ? 'rgba(24, 74, 52, 0.25)' : 'rgba(190, 58, 38, 0.25)',
                                background: winning ? 'rgba(24, 74, 52, 0.10)' : 'rgba(190, 58, 38, 0.10)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {winning ? '✅ Winning' : '❌ Outbid'}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div
                              className="rounded-xl border p-4"
                              style={{ borderColor: 'rgba(212, 197, 185, 0.7)', background: 'rgba(255,255,255,0.5)' }}
                            >
                              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                Your bid
                              </p>
                              <p className="mt-1 font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                                {formatPrice(bid.amount)}
                              </p>
                            </div>

                            <div
                              className="rounded-xl border p-4"
                              style={{ borderColor: 'rgba(212, 197, 185, 0.7)', background: 'rgba(255,255,255,0.5)' }}
                            >
                              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                Current bid
                              </p>
                              <p className="mt-1 font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                                {auction ? formatPrice(auction.currentBid) : '—'}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={`/auctions/${bid.auctionId}`}
                            className="mt-4 block w-full rounded-full py-2.5 text-center text-sm font-semibold transition-all hover:brightness-110"
                            style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                          >
                            {winning ? 'View auction' : 'Bid again'}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── WON AUCTIONS ───────────────────────────────────────── */}
            {activeTab === 'won' && (
              <div>
                <h2 className="font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  Won auctions
                </h2>

                {wonAuctions.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-5xl">🏆</div>
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      You haven&apos;t won any auctions yet.
                    </p>
                    <Link
                      href="/auctions"
                      className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
                      style={{ background: 'var(--clay)', color: '#F5EFE6' }}
                    >
                      Browse auctions
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {wonAuctions.map((auction) => (
                      <div
                        key={auction.id}
                        className="rounded-2xl border p-5"
                        style={{
                          borderColor: 'rgba(24, 74, 52, 0.28)',
                          background: 'rgba(24, 74, 52, 0.08)',
                        }}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              Auction #{auction.id?.substring(0, 8)}...
                            </p>
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                              Ended: {auction.endTime ? new Date(auction.endTime).toLocaleDateString('en-ZA') : '—'}
                            </p>
                            <p className="mt-3 font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                              {formatPrice(auction.currentBid)}
                            </p>
                          </div>

                          <div className="flex flex-col items-start gap-3 sm:items-end">
                            <span
                              className="rounded-full border px-3 py-1 text-xs font-semibold"
                              style={{
                                borderColor: 'rgba(24, 74, 52, 0.25)',
                                background: 'rgba(24, 74, 52, 0.10)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              🎉 Won
                            </span>

                            <Link
                              href={`/auctions/${auction.id}`}
                              className="text-sm font-semibold transition-colors hover:opacity-80"
                              style={{ color: 'var(--clay)' }}
                            >
                              View details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}