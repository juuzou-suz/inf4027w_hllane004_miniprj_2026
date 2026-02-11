'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllArtworks, deleteArtwork } from '@/lib/firestore';

export default function AdminArtworksPage() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // ID of artwork to delete

  useEffect(() => {
    fetchArtworks();
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
      // Remove from local state
      setArtworks(artworks.filter(a => a.id !== artworkId));
      setDeleteConfirm(null);
      alert('Artwork deleted successfully!');
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Failed to delete artwork. Please try again.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-green-100 text-green-800',
      in_auction: 'bg-blue-100 text-blue-800',
      sold: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800',
    };
    const labels = {
      available: 'Available',
      in_auction: 'In Auction',
      sold: 'Sold',
      archived: 'Archived',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.available}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Artworks
          </h1>
          <p className="text-gray-600">
            Add, edit, and delete artwork listings
          </p>
        </div>
        <Link
          href="/admin/artworks/new"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
        >
          + Add New Artwork
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchArtworks}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && artworks.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Artworks Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first artwork
          </p>
          <Link
            href="/admin/artworks/new"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            + Add New Artwork
          </Link>
        </div>
      )}

      {/* Artworks Table */}
      {!loading && !error && artworks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Artwork
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Style
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {artworks.map((artwork) => (
                  <tr key={artwork.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={artwork.imageUrl || 'https://via.placeholder.com/100'}
                          alt={artwork.title}
                          className="w-16 h-16 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {artwork.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {artwork.medium}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {artwork.artist}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {artwork.style}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {formatPrice(artwork.currentBid || artwork.startingBid)}
                      </div>
                      {artwork.currentBid && (
                        <div className="text-xs text-gray-500">
                          Starting: {formatPrice(artwork.startingBid)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(artwork.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/artworks/${artwork.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          target="_blank"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/artworks/${artwork.id}/edit`}
                          className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(artwork.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Delete Artwork?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this artwork? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
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