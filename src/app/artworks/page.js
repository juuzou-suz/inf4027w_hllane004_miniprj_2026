'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';

export default function ArtworksPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [artworks, setArtworks] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artworksData, auctionsData] = await Promise.all([
        getAllArtworks(),
        getAllAuctions()
      ]);
      setArtworks(artworksData);
      setAuctions(auctionsData);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load artworks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter out artworks that are in ANY auction (live, upcoming, or ended)
  const availableArtworks = artworks.filter(artwork => {
    // Check if artwork is in any auction
    const inAuction = auctions.some(auction => auction.artworkId === artwork.id);
    
    // Show only artworks NOT in auction AND have a price
    return !inAuction && artwork.price && artwork.status === 'available';
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);

  const handleAddToCart = (artwork) => {
    if (!user) {
      router.push(`/login?redirect=/artworks/${artwork.id}`);
      return;
    }
    addToCart(artwork);
    alert(`"${artwork.title}" added to cart!`);
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
            Browse and purchase artworks directly from emerging artists
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
              onClick={fetchData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && availableArtworks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Artworks Available for Purchase
            </h3>
            <p className="text-gray-600 mb-6">
              All artworks are currently in auctions. Check the auctions page!
            </p>
            <Link
              href="/auctions"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              View Auctions
            </Link>
          </div>
        )}

        {/* Artworks Grid */}
        {!loading && !error && availableArtworks.length > 0 && (
          <>
            <div className="mb-6 text-gray-600">
              {availableArtworks.length} artwork{availableArtworks.length === 1 ? '' : 's'} available for purchase
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableArtworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group"
                >
                  {/* Image */}
                  <Link href={`/artworks/${artwork.id}`}>
                    <div className="relative overflow-hidden h-52">
                      <img
                        src={artwork.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link href={`/artworks/${artwork.id}`}>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 truncate hover:text-purple-600 transition">
                        {artwork.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-2">by {artwork.artist}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {artwork.style && (
                        <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                          {artwork.style}
                        </span>
                      )}
                      {artwork.medium && (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {artwork.medium}
                        </span>
                      )}
                    </div>

                    {/* Price & Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-xl font-bold text-purple-600">
                          {formatPrice(artwork.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(artwork)}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}