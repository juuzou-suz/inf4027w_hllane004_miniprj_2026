'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllAuctions } from '@/lib/firestore';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, live, upcoming, ended

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const data = await getAllAuctions();
      setAuctions(data);
      setError('');
    } catch (err) {
      console.error('Error fetching auctions:', err);
      setError('Failed to load auctions.');
    } finally {
      setLoading(false);
    }
  };

  // Filter auctions based on selected tab
  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'all') return true;
    return auction.status === filter;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const styles = {
      live: 'bg-red-100 text-red-800',
      upcoming: 'bg-yellow-100 text-yellow-800',
      ended: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
    };
    const labels = {
      live: '🔴 Live Now',
      upcoming: '📅 Upcoming',
      ended: '⏹️ Ended',
      completed: '✅ Completed',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.ended}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Art Auctions
          </h1>
          <p className="text-xl text-gray-600">
            Participate in live auctions and bid on your favorite artworks
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Auctions
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === 'live'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔴 Live
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === 'upcoming'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Upcoming
            </button>
            <button
              onClick={() => setFilter('ended')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                filter === 'ended'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏹️ Ended
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchAuctions}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAuctions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No {filter !== 'all' ? filter : ''} Auctions Yet
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'live' 
                ? 'There are no live auctions at the moment. Check back soon!'
                : 'Check back later for upcoming auctions.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                View All Auctions
              </button>
            )}
          </div>
        )}

        {/* Auctions Grid */}
        {!loading && !error && filteredAuctions.length > 0 && (
          <>
            <div className="mb-6 text-gray-600">
              Showing {filteredAuctions.length} {filter !== 'all' ? filter : ''} {filteredAuctions.length === 1 ? 'auction' : 'auctions'}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAuctions.map((auction) => (
                <div key={auction.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                  {/* Auction Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Artwork Auction
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {auction.id.substring(0, 8)}...
                        </p>
                      </div>
                      {getStatusBadge(auction.status)}
                    </div>

                    {/* Current Bid */}
                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-purple-700 font-medium mb-1">
                        Current Bid
                      </div>
                      <div className="text-3xl font-bold text-purple-600">
                        {formatPrice(auction.currentBid)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {auction.bidCount || 0} {auction.bidCount === 1 ? 'bid' : 'bids'}
                      </div>
                    </div>

                    {/* Timing Info */}
                    <div className="space-y-2 mb-4">
                      {auction.status === 'live' && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Ends:</span> {new Date(auction.endTime).toLocaleString()}
                        </div>
                      )}
                      {auction.status === 'upcoming' && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Starts:</span> {new Date(auction.startTime).toLocaleString()}
                        </div>
                      )}
                      {auction.status === 'ended' && auction.winnerId && (
                        <div className="text-sm text-green-600 font-medium">
                          Winner: {auction.winnerId.substring(0, 8)}...
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                   {/* Action Button */}
<Link
  href={`/auctions/${auction.id}`}
  className="block w-full bg-purple-600 text-white text-center px-4 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
>
  {auction.status === 'live' ? 'View Auction' : 'View Details'}
</Link>
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