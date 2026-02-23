'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

import { getOrdersByUser, updateUser } from '@/lib/firestore';

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

  // Tabs
  const [activeTab, setActiveTab] = useState('details');

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Bids & Auctions
  const [bids, setBids] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // displayed, read-only by default
  const [newPassword, setNewPassword] = useState('');

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');

  // Wishlist (stored on user doc)
  const wishlist = Array.isArray(user?.wishlist) ? user.wishlist : [];
  const [wishlistWorking, setWishlistWorking] = useState(false);

  // Prevent overwriting user typing when refreshUser updates `user`
  const didInitForm = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    // Preload form values ONCE after user is available
    if (!didInitForm.current) {
      didInitForm.current = true;

      setName(user?.name || user?.displayName || '');
      setEmail(user?.email || '');

      const addr = user?.address || {};
      setStreet(addr?.street || '');
      setCity(addr?.city || '');
      setPostalCode(addr?.postalCode || '');
    }

    // Orders
    setOrdersLoading(true);
    getOrdersByUser(user.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setOrdersLoading(false));

    // Bids
    const bidsQuery = query(
      collection(db, 'bids'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubBids = onSnapshot(bidsQuery, (snap) => {
      setBids(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBidsLoading(false);
    });

    // Auctions
    const unsubAuctions = onSnapshot(collection(db, 'auctions'), (snap) => {
      setAuctions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubBids();
      unsubAuctions();
    };
  }, [user, router]);

  if (!user) return null;

  const displayName = (user?.name || user?.displayName || '').trim() || 'there';

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
    credit_card: 'Card',
    paypal: 'PayPal',
    eft: 'EFT',
    cash_on_delivery: 'Cash',
  };

  const getAuction = (auctionId) => auctions.find((a) => a.id === auctionId);
  const isWinning = (auctionId) => getAuction(auctionId)?.currentBidderId === user.uid;

  // Group bids by auction; keep latest per auction (bids already ordered desc)
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

  const tabs = [
    { id: 'details', label: 'Personal details', Icon: UserIcon },
    { id: 'orders', label: 'Order history', Icon: Package },
    { id: 'bids', label: 'Active bids', Icon: Gavel },
    { id: 'won', label: 'Won auctions', Icon: Trophy },
    { id: 'wishlist', label: 'Wishlist', Icon: Heart },
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
      // 1) Update Firestore profile fields
      await updateUser(user.uid, {
        name: name.trim(),
        email: user.email || email,
        address: {
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
        },
      });

      // 2) Optional: update password in Firebase Auth
      if (newPassword && newPassword.trim().length > 0) {
        if (newPassword.trim().length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

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

      // 3) Refresh AuthContext user so Navbar updates
      if (typeof refreshUser === 'function') {
        await refreshUser();
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      setFormError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const normalizeWishlistItem = (item) => {
    if (!item) return null;

    if (typeof item === 'string') return { id: item };
    if (typeof item === 'object') {
      return {
        id: item.id || item.artworkId || item.slug || '',
        title: item.title,
        artist: item.artist,
        imageUrl: item.imageUrl || item.image,
      };
    }
    return null;
  };

  const removeFromWishlist = async (id) => {
    if (!id || wishlistWorking) return;

    setWishlistWorking(true);
    try {
      const next = wishlist
        .map(normalizeWishlistItem)
        .filter(Boolean)
        .filter((w) => w.id !== id)
        .map((w) => w.id);

      await updateUser(user.uid, { wishlist: next });

      if (typeof refreshUser === 'function') {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
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
          <p className="mt-2 text-muted-foreground">
            Manage your account, orders, and collection.
          </p>
        </div>

        {/* Tabs (CENTERED) */}
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map(({ id, label, Icon }) => {
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
                </button>
              );
            })}
          </div>
        </div>

        {/* HORIZONTAL LINE */}
        <div className="mt-6 border-t border-border" />

        {/* Content (CENTERED) */}
        <div className="mt-8">
          {/* ===== Personal Details ===== */}
          {activeTab === 'details' && (
            <div className="mx-auto max-w-2xl">
              <form
                onSubmit={handleSaveDetails}
                className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-black text-foreground">
                      Personal information
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update your details and delivery address.
                    </p>
                  </div>

                  {/* Account mini-card */}
                  <div className="w-full rounded-2xl border border-border bg-background/40 p-4 sm:w-[260px]">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Account
                    </div>
                    <div className="mt-2 truncate text-sm font-semibold text-foreground">
                      {user.email}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {user?.role === 'admin' ? 'Admin' : 'Customer'}
                    </div>
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div className="rounded-xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.18)] px-4 py-3 text-sm text-[rgba(255,225,225,0.95)]">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Full Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Email Address
                    </label>
                    <input
                      value={email}
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-xl border border-border bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-muted-foreground/80 outline-none"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Email changes need Firebase re-auth. If you want that, I can add it.
                    </p>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                </div>

                {/* horizontal line */}
                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <MapPin size={16} /> Delivery Address
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Street Address
                      </label>
                      <input
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          City
                        </label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                          placeholder="City"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Postal Code
                        </label>
                        <input
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-[rgba(160,106,75,0.9)] focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]"
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} className="mr-2" />
                  {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* ===== Order History ===== */}
          {activeTab === 'orders' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Order history</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your recent purchases.</p>

              {ordersLoading ? (
                <Loader />
              ) : orders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  body="When you purchase artworks, your orders will appear here."
                  ctaHref="/artworks"
                  ctaLabel="Browse artworks"
                />
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-border bg-background/40 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">Order #{order.id?.substring(0, 8)}…</p>
                          <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </div>

                        <span
                          className="w-fit rounded-full border px-3 py-1 text-xs font-semibold"
                          style={{
                            borderColor: 'rgba(160,106,75,0.35)',
                            background: 'rgba(160,106,75,0.10)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {(order.status || 'paid').toUpperCase()}
                        </span>
                      </div>

                      {order.items?.length > 0 && (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex-shrink-0">
                              <img
                                src={item.imageUrl || 'https://via.placeholder.com/60x60'}
                                alt={item.title || 'Artwork'}
                                className="h-14 w-14 rounded-xl object-cover"
                              />
                              <p className="mt-1 w-14 truncate text-xs text-muted-foreground">{item.title}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <span className="text-xs text-muted-foreground">
                          {order.itemCount || order.items?.length || 0} item
                          {(order.itemCount || order.items?.length || 0) !== 1 ? 's' : ''} ·{' '}
                          {paymentLabels[order.paymentMethod] || order.paymentMethod || '—'}
                        </span>

                        <span className="font-display text-lg font-black text-foreground">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== Active Bids ===== */}
          {activeTab === 'bids' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Active bids</h2>
              <p className="mt-1 text-sm text-muted-foreground">Auctions you’ve interacted with recently.</p>

              {bidsLoading ? (
                <Loader />
              ) : activeBids.length === 0 ? (
                <EmptyState
                  title="No active bids"
                  body="Place bids on live auctions and they’ll show up here."
                  ctaHref="/auctions"
                  ctaLabel="Browse auctions"
                />
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

                          <span
                            className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                              winning
                                ? 'border-[rgba(24,74,52,0.30)] bg-[rgba(24,74,52,0.10)] text-foreground'
                                : 'border-[rgba(190,58,38,0.30)] bg-[rgba(190,58,38,0.10)] text-foreground'
                            }`}
                          >
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
                            <p className="mt-1 font-display text-xl font-black text-foreground">
                              {auction ? formatPrice(auction.currentBid) : '—'}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/auctions/${bid.auctionId}`}
                          className="mt-4 inline-flex w-full justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
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

          {/* ===== Won Auctions ===== */}
          {activeTab === 'won' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Won auctions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Auctions you’ve won.</p>

              {wonAuctions.length === 0 ? (
                <EmptyState
                  title="No won auctions yet"
                  body="Win an auction and it will appear here."
                  ctaHref="/auctions"
                  ctaLabel="Browse auctions"
                />
              ) : (
                <div className="mt-6 space-y-4">
                  {wonAuctions.map((auction) => (
                    <div key={auction.id} className="rounded-2xl border border-border bg-background/40 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Auction #{auction.id?.substring(0, 8)}…</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Ended: {auction.endTime ? new Date(auction.endTime).toLocaleDateString('en-ZA') : '—'}
                          </p>
                          <p className="mt-3 font-display text-2xl font-black text-foreground">
                            {formatPrice(auction.currentBid)}
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <span className="rounded-full border border-[rgba(24,74,52,0.30)] bg-[rgba(24,74,52,0.10)] px-3 py-1 text-xs font-semibold text-foreground">
                            WON
                          </span>

                          <Link
                            href={`/auctions/${auction.id}`}
                            className="text-sm font-semibold text-primary transition hover:opacity-80"
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

          {/* ===== Wishlist ===== */}
          {activeTab === 'wishlist' && (
            <div className="mx-auto max-w-2xl rounded-2xl bg-card p-6 md:p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h2 className="font-display text-xl font-black text-foreground">Wishlist</h2>
              <p className="mt-1 text-sm text-muted-foreground">Saved artworks you want to come back to.</p>

              {wishlist.length === 0 ? (
                <EmptyState
                  title="Your wishlist is empty"
                  body="Save artworks to your wishlist and they’ll show up here."
                  ctaHref="/artworks"
                  ctaLabel="Browse artworks"
                />
              ) : (
                <div className="mt-6 space-y-4">
                  {wishlist
                    .map(normalizeWishlistItem)
                    .filter(Boolean)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-5 rounded-2xl border border-border bg-background/40 p-5"
                      >
                        <img
                          src={item.imageUrl || 'https://via.placeholder.com/80x80'}
                          alt={item.title || 'Artwork'}
                          className="h-20 w-20 rounded-xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">
                            {item.title || `Artwork ${item.id}`}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">{item.artist || '—'}</p>

                          <Link
                            href="/artworks"
                            className="mt-2 inline-block text-sm font-semibold text-primary hover:opacity-80"
                          >
                            View artworks
                          </Link>
                        </div>

                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          disabled={wishlistWorking}
                          className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-60"
                          title="Remove from wishlist"
                        >
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