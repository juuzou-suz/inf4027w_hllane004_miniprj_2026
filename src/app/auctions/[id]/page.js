'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, addDoc, updateDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getArtworkById } from '@/lib/firestore';
import Link from 'next/link';

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const auctionId = params.id;

  const [auction, setAuction] = useState(null);
  const [artwork, setArtwork] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  // Fetch auction and artwork
  useEffect(() => {
    if (auctionId) {
      fetchAuctionData();
    }
  }, [auctionId]);

  // Real-time listener for bids
  useEffect(() => {
    if (!auctionId) return;

    const bidsQuery = query(
      collection(db, 'bids'),
      where('auctionId', '==', auctionId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(bidsQuery, (snapshot) => {
      const bidsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBids(bidsData);
    });

    return () => unsubscribe();
  }, [auctionId]);

  // Real-time listener for auction updates
  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = onSnapshot(doc(db, 'auctions', auctionId), (doc) => {
      if (doc.exists()) {
        setAuction({ id: doc.id, ...doc.data() });
      }
    });

    return () => unsubscribe();
  }, [auctionId]);

  const fetchAuctionData = async () => {
    try {
      setLoading(true);
      
      // Fetch auction
      const auctionDoc = await getDoc(doc(db, 'auctions', auctionId));
      
      if (!auctionDoc.exists()) {
        setError('Auction not found');
        setLoading(false);
        return;
      }

      const auctionData = { id: auctionDoc.id, ...auctionDoc.data() };
      setAuction(auctionData);

      // Fetch associated artwork
      const artworkData = await getArtworkById(auctionData.artworkId);
      setArtwork(artworkData);

      setError('');
    } catch (err) {
      console.error('Error fetching auction:', err);
      setError('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to place a bid');
      router.push('/login');
      return;
    }

    setError('');
    setBidding(true);

    try {
      const amount = parseFloat(bidAmount);

      // Validation
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid bid amount');
        setBidding(false);
        return;
      }

      if (amount <= auction.currentBid) {
        setError(`Bid must be higher than current bid of $${auction.currentBid}`);
        setBidding(false);
        return;
      }

      if (amount < auction.currentBid + auction.minimumIncrement) {
        setError(`Bid must be at least $${auction.currentBid + auction.minimumIncrement}`);
        setBidding(false);
        return;
      }

      if (auction.status !== 'live') {
        setError('This auction is not currently live');
        setBidding(false);
        return;
      }

      // Check if user is already the highest bidder
      if (auction.currentBidderId === user.uid) {
        setError('You are already the highest bidder');
        setBidding(false);
        return;
      }

      // Create bid document
      const bidData = {
        auctionId: auctionId,
        artworkId: auction.artworkId,
        userId: user.uid,
        userEmail: user.email,
        amount: amount,
        timestamp: serverTimestamp(),
        isWinning: true,
        isOutbid: false,
      };

      await addDoc(collection(db, 'bids'), bidData);

      // Update auction with new current bid
      await updateDoc(doc(db, 'auctions', auctionId), {
        currentBid: amount,
        currentBidderId: user.uid,
        bidCount: (auction.bidCount || 0) + 1,
      });

      // Update previous bids to mark them as outbid
      // (This would normally be done with a Cloud Function, but for simplicity we'll skip it)

      // Reset form
      setBidAmount('');
      setError('');
      alert('Bid placed successfully!');
    } catch (error) {
      console.error('Error placing bid:', error);
      setError('Failed to place bid. Please try again.');
    } finally {
      setBidding(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeRemaining = () => {
    if (!auction || !auction.endTime) return 'N/A';
    
    const end = new Date(auction.endTime);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Update time remaining every second
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-4">{error}</h2>
            <Link
              href="/auctions"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Back to Auctions
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Artwork & Auction Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artwork Image */}
            {artwork && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Artwork Details */}
            {artwork && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {artwork.title}
                </h2>
                <p className="text-xl text-gray-600 mb-4">
                  by {artwork.artist}
                </p>
                <p className="text-gray-700 mb-4">
                  {artwork.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Style:</span> {artwork.style}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Medium:</span> {artwork.medium}
                  </div>
                  {artwork.dimensions && (
                    <div>
                      <span className="font-medium text-gray-700">Size:</span>{' '}
                      {artwork.dimensions.width} × {artwork.dimensions.height} cm
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bid History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Bid History ({bids.length})
              </h3>
              {bids.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No bids yet. Be the first to bid!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-4 rounded-lg border ${
                        index === 0
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formatPrice(bid.amount)}
                            {index === 0 && (
                              <span className="ml-2 text-sm text-purple-600 font-medium">
                                (Current Highest)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {bid.userEmail}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(bid.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              {/* Status Badge */}
              <div className="mb-4">
                {auction.status === 'live' && (
                  <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold">
                    🔴 Live Auction
                  </span>
                )}
                {auction.status === 'upcoming' && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                    📅 Upcoming
                  </span>
                )}
                {auction.status === 'ended' && (
                  <span className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold">
                    ⏹️ Ended
                  </span>
                )}
              </div>

              {/* Current Bid */}
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-1">Current Bid</div>
                <div className="text-4xl font-bold text-purple-600">
                  {formatPrice(auction.currentBid)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {auction.bidCount || 0} {auction.bidCount === 1 ? 'bid' : 'bids'}
                </div>
              </div>

              {/* Time Remaining */}
              {auction.status === 'live' && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-700 font-medium mb-1">
                    Time Remaining
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {timeRemaining}
                  </div>
                </div>
              )}

              {/* Auction Times */}
              <div className="mb-6 space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Starts:</span>{' '}
                  {new Date(auction.startTime).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Ends:</span>{' '}
                  {new Date(auction.endTime).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Min Increment:</span>{' '}
                  {formatPrice(auction.minimumIncrement)}
                </div>
              </div>

              {/* Bid Form */}
              {auction.status === 'live' && (
                <div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}

                  {user ? (
                    <form onSubmit={handlePlaceBid} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Bid (ZAR)
                        </label>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min={auction.currentBid + auction.minimumIncrement}
                          step={auction.minimumIncrement}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={`Min: ${formatPrice(auction.currentBid + auction.minimumIncrement)}`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={bidding}
                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-400"
                      >
                        {bidding ? 'Placing Bid...' : 'Place Bid'}
                      </button>
                    </form>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full bg-purple-600 text-white text-center px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
                    >
                      Log In to Bid
                    </Link>
                  )}
                </div>
              )}

              {auction.status === 'upcoming' && (
                <div className="text-center p-6 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    Auction starts on {new Date(auction.startTime).toLocaleString()}
                  </p>
                </div>
              )}

              {auction.status === 'ended' && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 font-medium mb-2">
                    Auction Ended
                  </p>
                  {auction.winnerId && (
                    <p className="text-sm text-gray-600">
                      Winning bid: {formatPrice(auction.currentBid)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}