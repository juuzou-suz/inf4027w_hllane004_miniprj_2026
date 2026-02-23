'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

  const [formData, setFormData] = useState({
    artworkId: '',
    startTime: '',
    endTime: '',
    minimumIncrement: '10',
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll statuses (UI + DB correction), without re-render loops
  useEffect(() => {
    if (!auctions.length) return;

    const interval = setInterval(() => {
      setAuctions((prev) => {
        // update UI immediately
        const next = prev.map((a) => {
          const correct = getAuctionStatus(a);
          return correct === a.status ? a : { ...a, status: correct };
        });

        // push DB updates async (don’t block UI)
        (async () => {
          await Promise.all(
            prev.map(async (a) => {
              const correct = getAuctionStatus(a);
              if (correct !== a.status) {
                await updateAuctionStatusIfNeeded(a.id, { ...a, status: correct });
              }
            })
          );
        })();

        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [auctions.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artworksData, auctionsData] = await Promise.all([getAllArtworks(), getAllAuctions()]);

      const withStatus = auctionsData.map((a) => ({ ...a, status: getAuctionStatus(a) }));

      setArtworks(artworksData);
      setAuctions(withStatus);
      setError('');

      // Update DB if needed (async)
      (async () => {
        await Promise.all(
          withStatus.map(async (a) => {
            const original = auctionsData.find((x) => x.id === a.id);
            if (original && original.status !== a.status) {
              await updateAuctionStatusIfNeeded(a.id, a);
            }
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

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price ?? 0);

  const formatDateTime = (value) => {
    try {
      return new Date(value).toLocaleString('en-ZA');
    } catch {
      return '';
    }
  };

  const statusPill = (status) => {
    const map = {
      live: {
        bg: 'rgba(190, 58, 38, 0.14)',
        bd: 'rgba(190, 58, 38, 0.22)',
        fg: 'rgba(255, 220, 215, 0.95)',
      },
      upcoming: {
        bg: 'rgba(167, 107, 17, 0.14)',
        bd: 'rgba(167, 107, 17, 0.22)',
        fg: 'rgba(255, 235, 205, 0.95)',
      },
      ended: {
        bg: 'rgba(111, 102, 94, 0.16)',
        bd: 'rgba(111, 102, 94, 0.22)',
        fg: 'rgba(243, 236, 228, 0.88)',
      },
      completed: {
        bg: 'rgba(58, 122, 87, 0.14)',
        bd: 'rgba(58, 122, 87, 0.22)',
        fg: 'rgba(220, 255, 235, 0.95)',
      },
    };

    const v = map[status] || map.ended;

    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          background: v.bg,
          border: `1px solid ${v.bd}`,
          color: v.fg,
          letterSpacing: '0.06em',
        }}
      >
        {(status || 'ended').toUpperCase()}
      </span>
    );
  };

  const availableArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
      if (artwork.status !== 'available') return false;
      const hasAnyAuction = auctions.some((auction) => auction.artworkId === artwork.id);
      return !hasAnyAuction;
    });
  }, [artworks, auctions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (!artwork) {
        setError('Selected artwork not found.');
        return;
      }

      const now = new Date();
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      let status = 'upcoming';
      if (now >= start && now < end) status = 'live';
      else if (now >= end) status = 'ended';

      const auctionData = {
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
      };

      await addDoc(collection(db, 'auctions'), auctionData);

      setFormData({
        artworkId: '',
        startTime: '',
        endTime: '',
        minimumIncrement: '10',
      });

      setShowCreateForm(false);
      await fetchData();
      alert('Auction created successfully.');
    } catch (err) {
      console.error('Error creating auction:', err);
      setError('Failed to create auction. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            Auctions
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Create and schedule auctions for artworks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-xl px-5 py-3 text-sm font-semibold transition hover:brightness-110"
          style={{
            background: showCreateForm ? 'rgba(255,255,255,0.06)' : 'var(--clay)',
            color: showCreateForm ? 'var(--text-primary)' : '#F5EFE6',
            border: showCreateForm ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.08)',
          }}
          type="button"
        >
          {showCreateForm ? 'Cancel' : 'Create auction'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 rounded-2xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(190, 58, 38, 0.10)',
            border: '1px solid rgba(190, 58, 38, 0.22)',
            color: 'rgba(255, 220, 215, 0.95)',
          }}
        >
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div
          className="rounded-2xl p-8 mb-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
          }}
        >
          <div className="mb-6">
            <h2 className="font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              Create new auction
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Choose an artwork and set the start/end times.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Artwork */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Artwork <span style={{ color: 'rgba(190, 58, 38, 0.95)' }}>*</span>
              </label>

              <select
                name="artworkId"
                value={formData.artworkId}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Choose an artwork…</option>
                {availableArtworks.map((artwork) => (
                  <option key={artwork.id} value={artwork.id}>
                    {artwork.title} — {artwork.artist} (Start {formatPrice(artwork.startingBid)})
                  </option>
                ))}
              </select>

              {availableArtworks.length === 0 && (
                <p className="mt-2 text-sm" style={{ color: 'rgba(255, 220, 215, 0.92)' }}>
                  No available artworks. Artworks are either sold or already used in an auction.
                </p>
              )}
            </div>

            {/* Start */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Start time <span style={{ color: 'rgba(190, 58, 38, 0.95)' }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* End */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                End time <span style={{ color: 'rgba(190, 58, 38, 0.95)' }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Increment */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Minimum increment (ZAR)
              </label>
              <input
                type="number"
                name="minimumIncrement"
                value={formData.minimumIncrement}
                onChange={handleChange}
                min="1"
                step="1"
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={creating || availableArtworks.length === 0}
              className="w-full rounded-xl px-6 py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'var(--clay)',
                color: '#F5EFE6',
              }}
            >
              {creating ? 'Creating…' : 'Create auction'}
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-14">
          <div
            className="h-12 w-12 animate-spin rounded-full border-2"
            style={{ borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'var(--clay)' }}
          />
        </div>
      )}

      {/* Auctions Table */}
      {!loading && (
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Artwork', 'Current bid', 'Bids', 'Status', 'Start', 'End'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {auctions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No auctions yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  auctions.map((auction, idx) => (
                    <tr
                      key={auction.id}
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {(auction.artworkId || '').substring(0, 12)}…
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* subtle bottom separator strip */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      )}
    </div>
  );
}