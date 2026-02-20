'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getArtworkById } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ArtworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const artworkId = params.id;

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (artworkId) {
      fetchArtwork();
    }
  }, [artworkId]);

  const fetchArtwork = async () => {
    try {
      setLoading(true);

      // Fetch artwork
      const artworkData = await getArtworkById(artworkId);

      if (!artworkData) {
        setError('Artwork not found');
        setLoading(false);
        return;
      }

      // Check if artwork is in ANY auction
      const auctionsQuery = query(
        collection(db, 'auctions'),
        where('artworkId', '==', artworkId)
      );
      const auctionSnapshot = await getDocs(auctionsQuery);

      if (!auctionSnapshot.empty) {
        // Artwork is in an auction - redirect to auction page
        const auctionId = auctionSnapshot.docs[0].id;
        router.replace(`/auctions/${auctionId}`);
        return;
      }

      setArtwork(artworkData);
      setError('');
    } catch (err) {
      console.error('Error fetching artwork:', err);
      setError('Failed to load artwork details.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);

  const handleAddToCart = () => {
    if (!user) {
      const redirectUrl = encodeURIComponent(`/artworks/${artworkId}`);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }
    addToCart(artwork);
    alert(`"${artwork.title}" has been added to your cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
            <img
              src={artwork.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'}
              alt={artwork.title}
              className="w-full h-auto"
            />
          </div>

          {/* Details Section */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {artwork.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">by {artwork.artist}</p>

            {/* Price Box */}
            {artwork.price && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-8">
                <div className="text-sm text-purple-700 font-medium mb-2">Price</div>
                <div className="text-4xl font-bold text-purple-600">
                  {formatPrice(artwork.price)}
                </div>
              </div>
            )}

            {/* Artwork Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Artwork Details</h2>
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
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{artwork.description}</p>
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
            {artwork.status === 'available' && artwork.price ? (
              <button
                onClick={handleAddToCart}
                className="block w-full bg-green-600 text-white text-center px-6 py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
              >
                🛒 Add to Cart
              </button>
            ) : artwork.status === 'sold' ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-800 font-medium">This artwork has been sold</p>
              </div>
            ) : (
              <div className="text-center p-6 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 font-medium">This artwork is currently unavailable</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}