'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuctionStatus, updateAuctionStatusIfNeeded } from '@/lib/auctionHelpers';

export default function AdminAuctionsPage() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [detailsAuction, setDetailsAuction] = useState(null);

  const [formData, setFormData] = useState({
    artworkId: '',
    startTime: '',
    endTime: '',
    minimumIncrement: '10',
  });

  const auctionsRef = useRef([]);
  auctionsRef.current = auctions;

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      const prev = auctionsRef.current;
      if (!prev.length) return;

      const next = prev.map((a) => {
        const correct = getAuctionStatus(a);
        return correct === a.status ? a : { ...a, status: correct };
      });

      // Only trigger a re-render if something actually changed
      const hasChange = next.some((a, i) => a.status !== prev[i].status);
      if (hasChange) setAuctions(next);

      // Push DB updates async without affecting UI
      (async () => {
        await Promise.all(
          prev.map(async (a) => {
            const correct = getAuctionStatus(a);
            if (correct !== a.status) await updateAuctionStatusIfNeeded(a.id, { ...a, status: correct });
          })
        );
      })();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artworksData, auctionsData] = await Promise.all([getAllArtworks(), getAllAuctions()]);
      const withStatus = auctionsData.map((a) => ({ ...a, status: getAuctionStatus(a) }));
      setArtworks(artworksData);
      setAuctions(withStatus);
      setError('');

      (async () => {
        await Promise.all(
          withStatus.map(async (a) => {
            const original = auctionsData.find((x) => x.id === a.id);
            if (original && original.status !== a.status) await updateAuctionStatusIfNeeded(a.id, a);
          })
        );
      })();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuction = async () => {
    if (!cancelConfirm) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'auctions', cancelConfirm.id), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: user.uid,
      });
      await updateDoc(doc(db, 'artworks', cancelConfirm.artworkId), { status: 'available' });
      setAuctions((prev) => prev.map((a) => a.id === cancelConfirm.id ? { ...a, status: 'cancelled' } : a));
      setArtworks((prev) => prev.map((a) => a.id === cancelConfirm.artworkId ? { ...a, status: 'available' } : a));
      setCancelConfirm(null);
    } catch (err) {
      console.error('Error cancelling auction:', err);
      setError('Failed to cancel auction. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      if (!formData.artworkId || !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields.');
        return;
      }
      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        setError('End time must be after start time.');
        return;
      }
      const artwork = artworks.find((a) => a.id === formData.artworkId);
      if (!artwork) { setError('Selected artwork not found.'); return; }

      const now = new Date();
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      let status = 'upcoming';
      if (now >= start && now < end) status = 'live';
      else if (now >= end) status = 'ended';

      await addDoc(collection(db, 'auctions'), {
        artworkId: formData.artworkId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status,
        currentBid: artwork.startingBid,
        currentBidderId: null,
        startingBid: artwork.startingBid,
        bidCount: 0,
        minimumIncrement: parseFloat(formData.minimumIncrement || '10'),
        winnerId: null,
        finalPrice: null,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      setFormData({ artworkId: '', startTime: '', endTime: '', minimumIncrement: '10' });
      setShowCreateForm(false);
      await fetchData();
    } catch (err) {
      console.error('Error creating auction:', err);
      setError('Failed to create auction. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(price ?? 0);

  const formatDateTime = (value) => {
    try { return new Date(value).toLocaleString('en-ZA'); } catch { return ''; }
  };

  const statusPill = (status) => {
    const map = {
      live:      { bg: 'rgba(190,58,38,0.14)',   bd: 'rgba(190,58,38,0.22)',   fg: 'rgba(255,220,215,0.95)' },
      upcoming:  { bg: 'rgba(167,107,17,0.14)',  bd: 'rgba(167,107,17,0.22)',  fg: 'rgba(255,235,205,0.95)' },
      ended:     { bg: 'rgba(111,102,94,0.16)',  bd: 'rgba(111,102,94,0.22)',  fg: 'rgba(243,236,228,0.88)' },
      completed: { bg: 'rgba(58,122,87,0.14)',   bd: 'rgba(58,122,87,0.22)',   fg: 'rgba(220,255,235,0.95)' },
      cancelled: { bg: 'rgba(255,255,255,0.05)', bd: 'rgba(255,255,255,0.10)', fg: 'rgba(200,200,200,0.70)' },
    };
    const v = map[status] || map.ended;
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: v.bg, border: `1px solid ${v.bd}`, color: v.fg, letterSpacing: '0.06em' }}>
        {(status || 'ended').toUpperCase()}
      </span>
    );
  };

  const availableArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
      if (artwork.status !== 'available') return false;
      return !auctions.some((a) => a.artworkId === artwork.id && a.status !== 'cancelled');
    });
  }, [artworks, auctions]);

  const detailsArtwork = useMemo(() => {
    if (!detailsAuction) return null;
    return artworks.find((a) => a.id === detailsAuction.artworkId) || null;
  }, [detailsAuction, artworks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const canCancel = (status) => status === 'upcoming' || status === 'live';

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    color: 'var(--text-primary)',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Auctions</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Create and schedule auctions for artworks.</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} type="button"
          className="rounded-xl px-5 py-3 text-sm font-semibold transition hover:brightness-110"
          style={{ background: 'var(--clay)', color: '#F5EFE6', border: '1px solid rgba(255,255,255,0.08)' }}>
          Create auction
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl px-4 py-3 text-sm"
          style={{ background: 'rgba(190,58,38,0.10)', border: '1px solid rgba(190,58,38,0.22)', color: 'rgba(255,220,215,0.95)' }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-14">
          <div className="h-12 w-12 animate-spin rounded-full border-2"
            style={{ borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'var(--clay)' }} />
        </div>
      )}

      {/* Auctions table */}
      {!loading && (
        <div className="overflow-hidden rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Artwork', 'Current bid', 'Bids', 'Status', 'Start', 'End', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)', textAlign: h === 'Actions' ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auctions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No auctions yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  auctions.map((auction, idx) => {
                    const artwork = artworks.find((a) => a.id === auction.artworkId);
                    return (
                      <tr key={auction.id}
                        style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-6 py-4">
                          {artwork ? (
                            <div className="flex items-center gap-3 min-w-[180px]">
                              <img src={artwork.imageUrl || 'https://via.placeholder.com/48'} alt={artwork.title}
                                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                style={{ border: '1px solid rgba(255,255,255,0.10)' }} />
                              <div>
                                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{artwork.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{artwork.artist}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              {(auction.artworkId || '').substring(0, 12)}…
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--clay)' }}>
                          {formatPrice(auction.currentBid)}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {auction.bidCount || 0}
                        </td>
                        <td className="px-6 py-4">{statusPill(auction.status)}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDateTime(auction.startTime)}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDateTime(auction.endTime)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setDetailsAuction(auction)} type="button"
                              className="text-sm font-semibold transition hover:opacity-80"
                              style={{ color: 'var(--text-muted)' }}>
                              Details
                            </button>
                            {canCancel(auction.status) && (
                              <button onClick={() => setCancelConfirm(auction)} type="button"
                                className="text-sm font-semibold transition hover:opacity-80"
                                style={{ color: 'rgba(255,200,200,0.90)' }}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      )}

      {/* Create auction modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.70)' }}>
          <div className="w-full max-w-lg rounded-2xl p-8 shadow-2xl"
            style={{ background: 'var(--card, #1a1a1a)', border: '1px solid rgba(255,255,255,0.10)' }}>

            {/* Modal header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  Create new auction
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Choose an artwork and set the start/end times.
                </p>
              </div>
              <button onClick={() => setShowCreateForm(false)} type="button"
                className="rounded-full p-1.5 transition hover:bg-white/10 ml-4 flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Artwork dropdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>
                  Artwork <span style={{ color: 'rgba(190,58,38,0.95)' }}>*</span>
                </label>
                <select name="artworkId" value={formData.artworkId} onChange={handleChange} required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ color: 'var(--text-muted)' }}>
                  <option value="" style={{ color: '#111111', background: '#ffffff' }}>Choose an artwork…</option>
                  {availableArtworks.map((artwork) => (
                    <option key={artwork.id} value={artwork.id}
                      style={{ color: '#111111', background: '#ffffff' }}>
                      {artwork.title} — {artwork.artist} (Start {formatPrice(artwork.startingBid)})
                    </option>
                  ))}
                </select>
                {availableArtworks.length === 0 && (
                  <p className="mt-2 text-sm" style={{ color: 'rgba(255,220,215,0.92)' }}>
                    No available artworks. Artworks are either sold or already in an auction.
                  </p>
                )}
              </div>

              {/* Start time */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>
                  Start time <span style={{ color: 'rgba(190,58,38,0.95)' }}>*</span>
                </label>
                <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>

              {/* End time */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>
                  End time <span style={{ color: 'rgba(190,58,38,0.95)' }}>*</span>
                </label>
                <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>

              {/* Minimum increment */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>
                  Minimum increment (ZAR)
                </label>
                <input type="number" name="minimumIncrement" value={formData.minimumIncrement}
                  onChange={handleChange} min="1" step="1"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>

              {/* Form-level error */}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(190,58,38,0.10)', border: '1px solid rgba(190,58,38,0.22)', color: 'rgba(255,220,215,0.95)' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating || availableArtworks.length === 0}
                  className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--clay)', color: '#F5EFE6' }}>
                  {creating ? 'Creating…' : 'Create auction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-xl font-bold text-foreground mb-2">Cancel auction</h3>
            <p className="text-sm text-muted-foreground mb-1">Are you sure you want to cancel this auction?</p>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,235,205,0.90)' }}>
              The artwork will be restored to <strong>available</strong> so customers can purchase it directly.
            </p>
            {(() => {
              const artwork = artworks.find((a) => a.id === cancelConfirm.artworkId);
              return artwork ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 mb-6">
                  <img src={artwork.imageUrl || '/Images/placeholder.jpg'} alt={artwork.title}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{artwork.title}</p>
                    <p className="text-xs text-muted-foreground">by {artwork.artist}</p>
                  </div>
                </div>
              ) : null;
            })()}
            <div className="flex gap-3">
              <button onClick={() => setCancelConfirm(null)} disabled={cancelling} type="button"
                className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold border transition hover:opacity-90 disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}>
                Keep auction
              </button>
              <button onClick={handleCancelAuction} disabled={cancelling} type="button"
                className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold border transition hover:brightness-110 disabled:opacity-50"
                style={{ borderColor: 'rgba(255,120,120,0.30)', background: 'rgba(190,58,38,0.22)', color: 'rgba(255,225,225,0.95)' }}>
                {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {detailsAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-xl font-bold text-foreground">Auction details</h3>
              <button onClick={() => setDetailsAuction(null)} type="button"
                className="rounded-full p-1.5 transition hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {detailsArtwork ? (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4 mb-5">
                <img src={detailsArtwork.imageUrl || '/Images/placeholder.jpg'} alt={detailsArtwork.title}
                  className="h-20 w-20 rounded-xl object-cover flex-shrink-0 border border-border" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-black text-foreground truncate">{detailsArtwork.title}</p>
                  <p className="text-sm text-muted-foreground">by {detailsArtwork.artist}</p>
                  {detailsArtwork.medium && <p className="text-xs text-muted-foreground mt-0.5">{detailsArtwork.medium}</p>}
                  {detailsArtwork.style && <p className="text-xs text-muted-foreground">{detailsArtwork.style}</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-5">Artwork ID: {detailsAuction.artworkId}</p>
            )}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Status',        value: statusPill(detailsAuction.status) },
                { label: 'Bids placed',   value: detailsAuction.bidCount || 0 },
                { label: 'Starting bid',  value: formatPrice(detailsAuction.startingBid) },
                { label: 'Current bid',   value: formatPrice(detailsAuction.currentBid) },
                { label: 'Min increment', value: formatPrice(detailsAuction.minimumIncrement) },
                { label: 'Winner ID',     value: detailsAuction.winnerId ? detailsAuction.winnerId.substring(0, 10) + '…' : '—' },
                { label: 'Start',         value: formatDateTime(detailsAuction.startTime) },
                { label: 'End',           value: formatDateTime(detailsAuction.endTime) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-border bg-background/30 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                  <div className="text-sm font-semibold text-foreground">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {canCancel(detailsAuction.status) && (
                <button onClick={() => { setDetailsAuction(null); setCancelConfirm(detailsAuction); }} type="button"
                  className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold border transition hover:brightness-110"
                  style={{ borderColor: 'rgba(255,120,120,0.30)', background: 'rgba(190,58,38,0.18)', color: 'rgba(255,225,225,0.95)' }}>
                  Cancel auction
                </button>
              )}
              <button onClick={() => setDetailsAuction(null)} type="button"
                className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold border transition hover:opacity-90"
                style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}