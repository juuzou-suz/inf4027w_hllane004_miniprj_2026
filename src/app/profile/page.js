'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

import { getOrdersByUser, updateUser, getArtworkById } from '@/lib/firestore';

import {
  User as UserIcon,
  Package,
  Gavel,
  Trophy,
  Heart,
  MapPin,
  Save,
  Trash2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('details');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [bids, setBids] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');

  const [wishlistArtworks, setWishlistArtworks] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistWorking, setWishlistWorking] = useState(false);

  // Won auctions artwork details
  const [wonArtworks, setWonArtworks] = useState({});
  const [wonArtworksLoading, setWonArtworksLoading] = useState(false);

  const didInitForm = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (!didInitForm.current) {
      didInitForm.current = true;
      setName(user?.name || user?.displayName || '');
      setEmail(user?.email || '');
      const addr = user?.address || {};
      setStreet(addr?.street || '');
      setCity(addr?.city || '');
      setPostalCode(addr?.postalCode || '');
    }

    setOrdersLoading(true);
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

  // Fetch artwork details for won auctions
  useEffect(() => {
    const won = auctions.filter((a) => a.status === 'ended' && a.winnerId === user?.uid);
    if (won.length === 0) return;

    const missingIds = won
      .map((a) => a.artworkId)
      .filter((id) => id && !wonArtworks[id]);

    if (missingIds.length === 0) return;

    setWonArtworksLoading(true);
    Promise.all(missingIds.map((id) => getArtworkById(id).catch(() => null)))
      .then((results) => {
        const map = {};
        results.forEach((artwork) => {
          if (artwork) map[artwork.id] = artwork;
        });
        setWonArtworks((prev) => ({ ...prev, ...map }));
      })
      .finally(() => setWonArtworksLoading(false));
  }, [auctions, user?.uid]);

  // Fetch wishlist artworks 
  useEffect(() => {
    if (!user?.wishlist || !Array.isArray(user.wishlist)) {
      setWishlistArtworks([]);
      return;
    }

    const fetchWishlistArtworks = async () => {
      setWishlistLoading(true);
      try {
        const artworkPromises = user.wishlist.map(async (item) => {
          const artworkId = typeof item === 'string' ? item : item?.id || item?.artworkId;
          if (!artworkId) return null;
          try {
            return await getArtworkById(artworkId);
          } catch {
            return null;
          }
        });
        const artworks = await Promise.all(artworkPromises);
        setWishlistArtworks(artworks.filter(Boolean));
      } catch (error) {
        console.error('Error fetching wishlist artworks:', error);
      } finally {
        setWishlistLoading(false);
      }
    };

    fetchWishlistArtworks();
  }, [user?.wishlist]);

  if (!user) return null;

  const displayName = (user?.name || user?.displayName || '').trim() || 'there';

  const formatPrice = (value) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const paymentLabels = {
    credit_card: 'Card',
    paypal: 'PayPal',
    eft: 'EFT',
    cash_on_delivery: 'Cash',
  };

  const getAuction = (auctionId) => auctions.find((a) => a.id === auctionId);
  const isWinning = (auctionId) => getAuction(auctionId)?.currentBidderId === user.uid;

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

  // Count unpaid won auctions for badge
  const unpaidWonCount = useMemo(() => {
    return wonAuctions.filter((a) => a.paymentStatus !== 'paid').length;
  }, [wonAuctions]);

  const tabs = [
    { id: 'details', label: 'Personal details', Icon: UserIcon },
    { id: 'wishlist', label: 'Wishlist', Icon: Heart },
    { id: 'orders', label: 'Order history', Icon: Package },
    { id: 'bids', label: 'Active bids', Icon: Gavel },
    { id: 'won', label: 'Won auctions', Icon: Trophy, badge: unpaidWonCount },
  ];

  const Loader = () => (
    <div className="flex justify-center py-14">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );

  const EmptyState = ({ title, body, ctaHref, ctaLabel }) => (
    <div className="py-14 text-center">
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {ctaHref && (
        <Link
          href={ctaHref}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormError('');
    setSaved(false);
    setSaving(true);
    try {
      await updateUser(user.uid, {
        name: name.trim(),
        email: user.email || email,
        address: { street: street.trim(), city: city.trim(), postalCode: postalCode.trim() },
      });
      if (newPassword && newPassword.trim().length > 0) {
        if (newPassword.trim().length < 6) throw new Error('Password must be at least 6 characters.');
        try {
          await updatePassword(auth.currentUser, newPassword.trim());
          setNewPassword('');
        } catch (err) {
          const code = err?.code || '';
          if (code === 'auth/requires-recent-login') {
            throw new Error('To change your password, please log out and log in again, then retry.');
          }
          throw new Error('Password update failed. Please try again.');
        }
      }
      if (typeof refreshUser === 'function') await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      setFormError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeFromWishlist = async (id) => {
    if (!id || wishlistWorking) return;
    setWishlistWorking(true);
    try {
      const current = user?.wishlist || [];
      const ids = current.map((x) => (typeof x === 'string' ? x : x?.id || x?.artworkId)).filter(Boolean);
      const next = ids.filter((artworkId) => artworkId !== id);
      await updateUser(user.uid, { wishlist: next });
      setWishlistArtworks((prev) => prev.filter((artwork) => artwork.id !== id));
      if (typeof refreshUser === 'function') await refreshUser();
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setWishlistWorking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 text-muted-foreground">Manage your account, orders, and collection.</p>

          {/* Unpaid won auctions alert */}
          {unpaidWonCount > 0 && (
            <div
              className="mt-4 flex items-center justify-between gap-4 rounded-2xl border p-4"
              style={{ borderColor: 'rgba(160,106,75,0.45)', background: 'rgba(160,106,75,0.10)' }}
            >
              <div>
                <p className="font-semibold text-foreground">
                  You have {unpaidWonCount} unpaid won auction{unpaidWonCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete payment to claim your artwork{unpaidWonCount > 1 ? 's' : ''}.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('won')}
                className="flex-shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                type="button"
              >
                Complete payment
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map(({ id, label, Icon, badge }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor: active ? 'rgba(160,106,75,0.40)' : 'var(--border)',
                    background: active ? 'rgba(160,106,75,0.12)' : 'var(--card)',
                    color: active ? 'var(--clay)' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={16} />
                  {label}
                  {badge > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-border" />

        <div className="mt-8">
          {/* Personal Details */}
          {activeTab === 'details' && (
            <div className="mx-auto max-w-2xl">
              <form
                onSubmit={handleSaveDetails}
                className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-black text-foreground">Personal information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Update your details and delivery address.</p>
                  </div>
                  <div className="w-full rounded-2xl border border-border bg-background/40 p-4 sm:w-[260px]">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Account</div>
                    <div className="mt-2 truncate text-sm font-semibold text-foreground">{user.email}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {user?.role === 'admin' ? 'Admin' : 'Customer'}
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="rounded-xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.18)] px-4 py-3 text-sm text-[rgba(255,225,225,0.95)]">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                      placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <input value={email} disabled
                      className="mt-2 w-full cursor-not-allowed rounded-xl border border-border bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-muted-foreground/80 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                      placeholder="Leave blank to keep current" />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <MapPin size={16} /> Delivery Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Street Address</label>
                      <input value={street} onChange={(e) => setStreet(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                        placeholder="Street address" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">City</label>
                        <input value={city} onChange={(e) => setCity(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                          placeholder="City" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Postal Code</label>
                        <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                          placeholder="Postal code" />
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={saving}
                  className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  <Save size={16} className="mr-2" />
                  {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Order History */}
          {activeTab === 'orders' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Order history</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your recent purchases.</p>
              {ordersLoading ? <Loader /> : orders.length === 0 ? (
                <EmptyState title="No orders yet" body="When you purchase artworks, your orders will appear here." ctaHref="/artworks" ctaLabel="Browse artworks" />
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-border bg-background/40 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            Order #{order.id?.substring(0, 8)}…
                            {order.type === 'auction' && (
                              <span
                                className="ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                borderColor: 'rgba(160,106,75,0.35)',
                                background: 'rgba(160,106,75,0.10)',
                                color: 'var(--text-primary)',
                                }}
                              >
                                Auction purchase
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className="w-fit rounded-full border px-3 py-1 text-xs font-semibold"
                          style={{ borderColor: 'rgba(160,106,75,0.35)', background: 'rgba(160,106,75,0.10)', color: 'var(--text-primary)' }}>
                          {(order.status || 'paid').toUpperCase()}
                        </span>
                      </div>
                      {order.items?.length > 0 && (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex-shrink-0">
                              <img src={item.imageUrl || '/Images/placeholder.jpg'} alt={item.title || 'Artwork'}
                                className="h-14 w-14 rounded-xl object-cover"
                                onError={(e) => { e.currentTarget.src = '/Images/placeholder.png'; }} />
                              <p className="mt-1 w-14 truncate text-xs text-muted-foreground">{item.title}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <span className="text-xs text-muted-foreground">
                          {order.itemCount || order.items?.length || 0} item{(order.itemCount || order.items?.length || 0) !== 1 ? 's' : ''} · {paymentLabels[order.paymentMethod] || order.paymentMethod || '—'}
                        </span>
                        <span className="font-display text-lg font-black text-foreground">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Bids */}
          {activeTab === 'bids' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Active bids</h2>
              <p className="mt-1 text-sm text-muted-foreground">Auctions you've interacted with recently.</p>
              {bidsLoading ? <Loader /> : activeBids.length === 0 ? (
                <EmptyState title="No active bids" body="Place bids on live auctions and they'll show up here." ctaHref="/auctions" ctaLabel="Browse auctions" />
              ) : (
                <div className="mt-6 space-y-4">
                  {activeBids.map((bid) => {
                    const auction = getAuction(bid.auctionId);
                    const winning = isWinning(bid.auctionId);
                    return (
                      <div key={bid.auctionId} className="rounded-2xl border border-border bg-background/40 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">Auction #{bid.auctionId?.substring(0, 8)}…</p>
                            <p className="mt-1 text-sm text-muted-foreground">Status: {auction?.status || '—'}</p>
                          </div>
                          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${winning ? 'border-[rgba(24,74,52,0.30)] bg-[rgba(24,74,52,0.10)] text-foreground' : 'border-[rgba(190,58,38,0.30)] bg-[rgba(190,58,38,0.10)] text-foreground'}`}>
                            {winning ? 'WINNING' : 'OUTBID'}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Your bid</p>
                            <p className="mt-1 font-display text-xl font-black text-foreground">{formatPrice(bid.amount)}</p>
                          </div>
                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Current bid</p>
                            <p className="mt-1 font-display text-xl font-black text-foreground">{auction ? formatPrice(auction.currentBid) : '—'}</p>
                          </div>
                        </div>
                        <Link href={`/auctions/${bid.auctionId}`}
                          className="mt-4 inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                          {winning ? 'View auction' : 'Bid again'}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Won Auctions */}
          {activeTab === 'won' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Won auctions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Auctions you've won — pay to claim your artwork.</p>

              {wonAuctions.length === 0 ? (
                <EmptyState title="No won auctions yet" body="Win an auction and it will appear here." ctaHref="/auctions" ctaLabel="Browse auctions" />
              ) : wonArtworksLoading ? <Loader /> : (
                <div className="mt-6 space-y-4">
                  {wonAuctions.map((auction) => {
                    const artwork = wonArtworks[auction.artworkId];
                    const isPaid = auction.paymentStatus === 'paid';

                    return (
                      <div key={auction.id} className="rounded-2xl border border-border bg-background/40 p-5">
                        <div className="flex items-start gap-4">
                          {/* Artwork thumbnail */}
                          {artwork?.imageUrl && (
                            <img
                              src={artwork.imageUrl}
                              alt={artwork.title}
                              className="h-20 w-20 flex-shrink-0 rounded-xl object-cover border border-border"
                             onError={(e) => { e.currentTarget.src = '/Images/placeholder.png'; }}
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-display text-lg font-black text-foreground">
                                  {artwork?.title || `Auction #${auction.id?.substring(0, 8)}…`}
                                </p>
                                {artwork?.artist && (
                                  <p className="text-sm text-muted-foreground">by {artwork.artist}</p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Ended: {auction.endTime ? new Date(auction.endTime).toLocaleDateString('en-ZA') : '—'}
                                </p>
                              </div>

                              {/* Payment status badge */}
                              <span
                                className="flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold"
                                style={
                                  isPaid
                                    ? {
                                        borderColor: 'rgba(24,74,52,0.30)',
                                        background: 'rgba(24,74,52,0.10)',
                                        color: 'var(--text-primary)',
                                      }
                                    : {
                                        borderColor: 'rgba(255,120,120,0.30)',
                                        background: 'rgba(190,58,38,0.14)',
                                        color: 'rgba(255,225,225,0.95)',
                                     }
                               }
                              >
                                {isPaid ? 'PAID' : 'PAYMENT REQUIRED'}
                              </span>
                            </div>

                            <p className="mt-2 font-display text-xl font-black text-foreground">
                              {formatPrice(auction.currentBid)}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {!isPaid ? (
                                <Link
                                  href={`/auctions/checkout?auctionId=${auction.id}`}
                                  className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                                >
                                  Complete payment
                                </Link>
                              ) : (
                                <Link
                                  href={`/orderConfirmation?orderId=${auction.orderId}`}
                                  className="inline-flex items-center rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-white/5"
                                >
                                  View receipt
                                </Link>
                              )}
                              <Link
                                href={`/auctions/${auction.id}`}
                                className="inline-flex items-center rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-white/5"
                              >
                                View auction
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Wishlist</h2>
              <p className="mt-1 text-sm text-muted-foreground">Saved artworks you want to come back to.</p>
              {wishlistLoading ? <Loader /> : wishlistArtworks.length === 0 ? (
                <EmptyState title="Your wishlist is empty" body="Save artworks to your wishlist and they'll show up here." ctaHref="/artworks" ctaLabel="Browse artworks" />
              ) : (
                <div className="mt-6 space-y-4">
                  {wishlistArtworks.map((artwork) => (
                    <div key={artwork.id} className="flex items-center gap-5 rounded-2xl border border-border bg-background/40 p-5">
                      <img src={artwork.imageUrl || '/Images/placeholder.jpg'} alt={artwork.title || 'Artwork'}
                        className="h-20 w-20 rounded-xl object-cover"
                        onError={(e) => { e.currentTarget.src = '/Images/placeholder.png'; }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{artwork.title || 'Untitled'}</p>
                        <p className="truncate text-sm text-muted-foreground">by {artwork.artist || 'Unknown Artist'}</p>
                        <p className="mt-1 font-display text-lg font-bold text-primary">
                          {formatPrice(artwork.price || artwork.startingBid || 0)}
                        </p>
                        <Link href={`/artworks/${artwork.id}`} className="mt-2 inline-block text-sm font-semibold text-primary hover:opacity-80">
                          View artwork →
                        </Link>
                      </div>
                      <button onClick={() => removeFromWishlist(artwork.id)} disabled={wishlistWorking}
                        className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-60"
                        title="Remove from wishlist">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}