'use client';

import { useState, useEffect } from 'react';
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

  // Form state
  const [formData, setFormData] = useState({
    artworkId: '',
    startTime: '',
    endTime: '',
    minimumIncrement: '10',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Check and update statuses every 10 seconds
  useEffect(() => {
    if (auctions.length === 0) return;

    const checkStatuses = async () => {
      const updatedAuctions = await Promise.all(
        auctions.map(async (auction) => {
          const correctStatus = getAuctionStatus(auction);
          if (correctStatus !== auction.status) {
            await updateAuctionStatusIfNeeded(auction.id, auction);
          }
          return { ...auction, status: correctStatus };
        })
      );
      setAuctions(updatedAuctions);
    };

    // Check immediately
    checkStatuses();

    // Check every 10 seconds
    const interval = setInterval(checkStatuses, 10000);

    return () => clearInterval(interval);
  }, [auctions.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artworksData, auctionsData] = await Promise.all([
        getAllArtworks(),
        getAllAuctions()
      ]);
      
      // Update statuses on initial load
      const auctionsWithCorrectStatus = auctionsData.map(auction => ({
        ...auction,
        status: getAuctionStatus(auction)
      }));
      
      setArtworks(artworksData);
      setAuctions(auctionsWithCorrectStatus);
      
      // Update in database if needed (don't wait for this)
      auctionsWithCorrectStatus.forEach(auction => {
        if (auction.status !== auctionsData.find(a => a.id === auction.id).status) {
          updateAuctionStatusIfNeeded(auction.id, auction);
        }
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      // Validate
      if (!formData.artworkId || !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields');
        setCreating(false);
        return;
      }

      // Check if end time is after start time
      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        setError('End time must be after start time');
        setCreating(false);
        return;
      }

      // Get selected artwork
      const artwork = artworks.find(a => a.id === formData.artworkId);
      if (!artwork) {
        setError('Selected artwork not found');
        setCreating(false);
        return;
      }

      // Determine auction status based on times
      const now = new Date();
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);
      
      let status = 'upcoming';
      if (now >= startTime && now < endTime) {
        status = 'live';
      } else if (now >= endTime) {
        status = 'ended';
      }

      // Create auction
      const auctionData = {
        artworkId: formData.artworkId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: status,
        currentBid: artwork.startingBid,
        currentBidderId: null,
        startingBid: artwork.startingBid,
        bidCount: 0,
        minimumIncrement: parseFloat(formData.minimumIncrement),
        winnerId: null,
        finalPrice: null,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      };

      await addDoc(collection(db, 'auctions'), auctionData);

      // Reset form and refresh
      setFormData({
        artworkId: '',
        startTime: '',
        endTime: '',
        minimumIncrement: '10',
      });
      setShowCreateForm(false);
      fetchData();
      alert('Auction created successfully!');
    } catch (error) {
      console.error('Error creating auction:', error);
      setError('Failed to create auction. Please try again.');
    } finally {
      setCreating(false);
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
      live: 'bg-red-100 text-red-800',
      upcoming: 'bg-yellow-100 text-yellow-800',
      ended: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.ended}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  // Get available artworks (not currently in auction)
  const availableArtworks = artworks.filter(artwork => {
    // Check if artwork is already in an active auction
    const hasActiveAuction = auctions.some(
      auction => auction.artworkId === artwork.id && 
      (auction.status === 'live' || auction.status === 'upcoming')
    );
    return !hasActiveAuction && artwork.status === 'available';
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Auctions
          </h1>
          <p className="text-gray-600">
            Create and schedule auctions for artworks
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
        >
          {showCreateForm ? '✕ Cancel' : '+ Create Auction'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Create New Auction
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Artwork */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Artwork <span className="text-red-500">*</span>
              </label>
              <select
                name="artworkId"
                value={formData.artworkId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Choose an artwork...</option>
                {availableArtworks.map(artwork => (
                  <option key={artwork.id} value={artwork.id}>
                    {artwork.title} by {artwork.artist} - Starting at {formatPrice(artwork.startingBid)}
                  </option>
                ))}
              </select>
              {availableArtworks.length === 0 && (
                <p className="text-sm text-red-600 mt-2">
                  No available artworks. All artworks are either in active auctions or not available.
                </p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Minimum Increment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Bid Increment (ZAR)
              </label>
              <input
                type="number"
                name="minimumIncrement"
                value={formData.minimumIncrement}
                onChange={handleChange}
                min="1"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={creating || availableArtworks.length === 0}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Auction'}
            </button>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Auctions List */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Artwork ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Current Bid
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Bids
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Start Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    End Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auctions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No auctions created yet. Click "Create Auction" to get started.
                    </td>
                  </tr>
                ) : (
                  auctions.map((auction) => (
                    <tr key={auction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {auction.artworkId.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 font-semibold text-purple-600">
                        {formatPrice(auction.currentBid)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {auction.bidCount || 0}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(auction.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(auction.startTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(auction.endTime).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}