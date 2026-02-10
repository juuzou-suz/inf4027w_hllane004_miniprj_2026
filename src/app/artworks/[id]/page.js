'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getArtworkById } from '@/lib/firestore';

export default function ArtworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const artworkId = params.id;

  // State
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch artwork when page loads
  useEffect(() => {
    if (artworkId) {
      fetchArtwork();
    }
  }, [artworkId]);

  const fetchArtwork = async () => {
    try {
      setLoading(true);
      const data = await getArtworkById(artworkId);
      
      if (!data) {
        setError('Artwork not found');
      } else {
        setArtwork(data);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching artwork:', err);
      setError('Failed to load artwork details.');
    } finally {
      setLoading(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_auction: 'bg-blue-100 text-blue-800',
      sold: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      available: 'Available',
      in_auction: 'In Auction',
      sold: 'Sold',
      archived: 'Archived',
    };
    return labels[status] || status;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-4">
              {error || 'Artwork Not Found'}
            </h2>
            <p className="text-red-700 mb-6">
              The artwork you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/artworks"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Back to Artworks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-purple-600 mb-8 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative">
              <img
                src={artwork.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'}
                alt={artwork.title}
                className="w-full h-auto"
              />
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(artwork.status)}`}>
                  {getStatusLabel(artwork.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div>
            {/* Title and Artist */}
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {artwork.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              by {artwork.artist}
            </p>

            {/* Price */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-8">
              {artwork.currentBid ? (
                <div>
                  <div className="text-sm text-purple-700 font-medium mb-2">
                    Current Bid
                  </div>
                  <div className="text-4xl font-bold text-purple-600">
                    {formatPrice(artwork.currentBid)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Starting bid: {formatPrice(artwork.startingBid)}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-purple-700 font-medium mb-2">
                    Starting Bid
                  </div>
                  <div className="text-4xl font-bold text-purple-600">
                    {formatPrice(artwork.startingBid)}
                  </div>
                </div>
              )}
            </div>

            {/* Artwork Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Artwork Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="font-medium text-gray-700">Style</span>
                  <span className="text-gray-900">{artwork.style}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="font-medium text-gray-700">Medium</span>
                  <span className="text-gray-900">{artwork.medium}</span>
                </div>
                {artwork.dimensions && (
                  <div className="flex justify-between border-b border-gray-200 pb-3">
                    <span className="font-medium text-gray-700">Dimensions</span>
                    <span className="text-gray-900">
                      {artwork.dimensions.width} × {artwork.dimensions.height}
                      {artwork.dimensions.depth && ` × ${artwork.dimensions.depth}`} cm
                    </span>
                  </div>
                )}
                {artwork.yearCreated && (
                  <div className="flex justify-between border-b border-gray-200 pb-3">
                    <span className="font-medium text-gray-700">Year</span>
                    <span className="text-gray-900">{artwork.yearCreated}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {artwork.description && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {artwork.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Button */}
            {artwork.status === 'in_auction' && (
              <Link
                href={`/auctions/${artwork.id}`}
                className="block w-full bg-purple-600 text-white text-center px-6 py-4 rounded-lg hover:bg-purple-700 transition font-semibold text-lg"
              >
                View Live Auction
              </Link>
            )}

            {artwork.status === 'available' && (
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">
                  This artwork will be available in upcoming auctions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}