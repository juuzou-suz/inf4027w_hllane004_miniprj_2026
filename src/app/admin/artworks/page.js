'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllArtworks, deleteArtwork } from '@/lib/firestore';

export default function AdminArtworksPage() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchArtworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const data = await getAllArtworks();
      setArtworks(data);
      setError('');
    } catch (err) {
      console.error('Error fetching artworks:', err);
      setError('Failed to load artworks.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (artworkId) => {
    try {
      await deleteArtwork(artworkId);
      setArtworks((prev) => prev.filter((a) => a.id !== artworkId));
      setDeleteConfirm(null);
      alert('Artwork deleted successfully.');
    } catch (err) {
      console.error('Error deleting artwork:', err);
      alert('Failed to delete artwork. Please try again.');
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price ?? 0);

  const StatusBadge = ({ status }) => {
    const map = {
      available: {
        label: 'Available',
        bg: 'rgba(190,255,210,0.12)',
        bd: 'rgba(190,255,210,0.25)',
        fg: 'rgba(210,255,230,0.95)',
      },
      in_auction: {
        label: 'In auction',
        bg: 'rgba(140,180,255,0.10)',
        bd: 'rgba(140,180,255,0.28)',
        fg: 'rgba(210,230,255,0.95)',
      },
      sold: {
        label: 'Sold',
        bg: 'rgba(255,255,255,0.06)',
        bd: 'rgba(255,255,255,0.10)',
        fg: 'rgba(245,239,230,0.90)',
      },
      archived: {
        label: 'Archived',
        bg: 'rgba(190,58,38,0.14)',
        bd: 'rgba(255,120,120,0.30)',
        fg: 'rgba(255,225,225,0.95)',
      },
    };

    const v = map[status] || map.available;

    return (
      <span
        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
        style={{ background: v.bg, borderColor: v.bd, color: v.fg }}
      >
        {v.label}
      </span>
    );
  };

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black mb-2">Artworks</h1>
          <p className="text-muted-foreground">Add, edit, and manage listings.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchArtworks}
            className="rounded-full px-4 py-2 text-xs font-semibold border transition hover:opacity-90"
            style={{
              borderColor: 'rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)',
            }}
            type="button"
          >
            Refresh
          </button>

          <Link
            href="/admin/artworks/new"
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition hover:brightness-110
                       bg-primary text-primary-foreground"
          >
            Add artwork
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] p-6 mb-6">
          <p className="text-[rgba(255,225,225,0.95)]">{error}</p>
          <button
            onClick={fetchArtworks}
            className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:brightness-110
                       bg-primary text-primary-foreground"
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && artworks.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-lg">
          <h3 className="font-display text-2xl font-black mb-2">No artworks yet</h3>
          <p className="text-muted-foreground mb-6">Create your first listing to get started.</p>
          <Link
            href="/admin/artworks/new"
            className="inline-block rounded-full px-6 py-3 text-sm font-semibold transition hover:brightness-110
                       bg-primary text-primary-foreground"
          >
            Add artwork
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && !error && artworks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <tr>
                  <Th>Artwork</Th>
                  <Th>Artist</Th>
                  <Th>Style</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>

              <tbody
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {artworks.map((artwork) => (
                  <tr
                    key={artwork.id}
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                    className="transition"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 min-w-[320px]">
                        <img
                          src={artwork.imageUrl || 'https://via.placeholder.com/100'}
                          alt={artwork.title}
                          className="w-14 h-14 object-cover rounded-xl border"
                          style={{ borderColor: 'rgba(255,255,255,0.10)' }}
                        />
                        <div>
                          <div className="font-semibold text-foreground">{artwork.title}</div>
                          <div className="text-sm text-muted-foreground">{artwork.medium || '—'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-foreground/90">{artwork.artist || '—'}</td>
                    <td className="px-6 py-4 text-sm text-foreground/90">{artwork.style || '—'}</td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">
                        {formatPrice(artwork.currentBid || artwork.startingBid || artwork.price || 0)}
                      </div>
                      {!!artwork.currentBid && (
                        <div className="text-xs text-muted-foreground">
                          Starting: {formatPrice(artwork.startingBid || 0)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={artwork.status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/artworks/${artwork.id}`}
                          className="text-sm font-semibold transition hover:opacity-80"
                          style={{ color: 'var(--text-muted)' }}
                          target="_blank"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/artworks/${artwork.id}/edit`}
                          className="text-sm font-semibold transition hover:opacity-80"
                          style={{ color: 'var(--clay)' }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(artwork.id)}
                          className="text-sm font-semibold transition hover:opacity-80"
                          style={{ color: 'rgba(255,225,225,0.95)' }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.65)' }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-xl font-bold text-foreground mb-2">Delete artwork</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone. The artwork will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold border transition hover:opacity-90"
                style={{
                  borderColor: 'rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                }}
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold border transition hover:brightness-110"
                style={{
                  borderColor: 'rgba(255,120,120,0.30)',
                  background: 'rgba(190,58,38,0.22)',
                  color: 'rgba(255,225,225,0.95)',
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th
      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest"
      style={{
        color: 'var(--text-muted)',
        textAlign: align || 'left',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}