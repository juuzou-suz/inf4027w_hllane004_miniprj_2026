'use client';

import { useState, useEffect } from 'react';
import ArtworkCard from '@/components/artworkCard';
import { getAllArtworks } from '@/lib/firestore';

export default function ArtworksPage() {
  // State for artworks data
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch artworks when page loads
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
      setError('Failed to load artworks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Artworks Collection
          </h1>
          <p className="text-xl text-gray-600">
            Browse our curated collection of artworks from emerging artists
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Artworks Yet
            </h3>
            <p className="text-gray-600">
              Check back soon for new artworks from emerging artists.
            </p>
          </div>
        )}

        {/* Artworks Grid */}
        {!loading && !error && artworks.length > 0 && (
          <>
            <div className="mb-6 text-gray-600">
              Showing {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}