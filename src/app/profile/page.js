'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOrdersByUser } from '@/lib/firestore';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Bids & Auctions
  const [bids, setBids] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    // Fetch orders
    getOrdersByUser(user.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setOrdersLoading(false));

    // Real-time bids listener
    const bidsQuery = query(
      collection(db, 'bids'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubBids = onSnapshot(bidsQuery, (snap) => {
      setBids(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBidsLoading(false);
    });

    // Real-time auctions listener
    const unsubAuctions = onSnapshot(collection(db, 'auctions'), (snap) => {
      setAuctions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubBids(); unsubAuctions(); };
  }, [user, router]);

  if (!user) return null;

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const paymentLabels = {
    credit_card: '💳 Card',
    paypal: '🅿️ PayPal',
    eft: '🏦 EFT',
    cash_on_delivery: '💵 Cash',
  };

  const getAuction = (auctionId) => auctions.find((a) => a.id === auctionId);
  const isWinning = (auctionId) => getAuction(auctionId)?.currentBidderId === user.uid;

  // Group bids by auction, keep only latest per auction
  const bidsByAuction = bids.reduce((acc, bid) => {
    if (!acc[bid.auctionId]) acc[bid.auctionId] = bid;
    return acc;
  }, {});

  const activeBids = Object.values(bidsByAuction).filter((bid) => {
    const auction = getAuction(bid.auctionId);
    return auction && (auction.status === 'live' || auction.status === 'upcoming');
  });

  const wonAuctions = auctions.filter(
    (a) => a.status === 'ended' && a.winnerId === user.uid
  );

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              👤
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{user.email}</h1>
              <p className="text-purple-200">Customer Account</p>
            </div>
            <button
              onClick={logout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition font-medium"
            >
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-purple-200 text-sm">Orders</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{wonAuctions.length}</div>
              <div className="text-purple-200 text-sm">Won Auctions</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{formatPrice(totalSpent)}</div>
              <div className="text-purple-200 text-sm">Total Spent</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'orders', label: '📦 Order History' },
              { id: 'bids', label: '⚡ Active Bids' },
              { id: 'won', label: '🏆 Won Auctions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── ORDER HISTORY ─────────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order History</h2>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600 mb-6">No orders yet.</p>
                    <Link href="/artworks" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
                      Browse Artworks
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-bold text-gray-900">Order #{order.id.substring(0, 8)}...</p>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ✅ {order.status?.toUpperCase()}
                          </span>
                        </div>

                        {/* Item thumbnails */}
                        <div className="flex gap-3 mb-4 overflow-x-auto">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex-shrink-0">
                              <img
                                src={item.imageUrl || 'https://via.placeholder.com/60x60'}
                                alt={item.title}
                                className="w-14 h-14 object-cover rounded-lg"
                              />
                              <p className="text-xs text-gray-600 mt-1 w-14 truncate">{item.title}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-500">
                            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} ·{' '}
                            {paymentLabels[order.paymentMethod] || order.paymentMethod}
                          </span>
                          <span className="font-bold text-purple-600 text-lg">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE BIDS ───────────────────────────────────────────────── */}
            {activeTab === 'bids' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Active Auction Bids</h2>
                {bidsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : activeBids.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚡</div>
                    <p className="text-gray-600 mb-6">No active bids.</p>
                    <Link href="/auctions" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
                      Browse Auctions
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBids.map((bid) => {
                      const auction = getAuction(bid.auctionId);
                      const winning = isWinning(bid.auctionId);
                      return (
                        <div key={bid.auctionId} className={`border-2 rounded-xl p-5 ${winning ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-gray-900">Auction #{bid.auctionId.substring(0, 8)}...</p>
                              <p className="text-sm text-gray-600">Status: {auction?.status}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${winning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {winning ? '✅ Winning' : '❌ Outbid'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Your Bid</p>
                              <p className="text-xl font-bold text-purple-600">{formatPrice(bid.amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Current Bid</p>
                              <p className="text-xl font-bold text-gray-900">{auction && formatPrice(auction.currentBid)}</p>
                            </div>
                          </div>
                          <Link
                            href={`/auctions/${bid.auctionId}`}
                            className="block w-full text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                          >
                            {winning ? 'View Auction' : 'Bid Again'}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── WON AUCTIONS ─────────────────────────────────────────────── */}
            {activeTab === 'won' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Won Auctions</h2>
                {wonAuctions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <p className="text-gray-600 mb-6">You haven't won any auctions yet.</p>
                    <Link href="/auctions" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold">
                      Browse Auctions
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wonAuctions.map((auction) => (
                      <div key={auction.id} className="border-2 border-green-300 bg-green-50 rounded-xl p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900">Auction #{auction.id.substring(0, 8)}...</p>
                            <p className="text-sm text-gray-600">Ended: {new Date(auction.endTime).toLocaleDateString()}</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">{formatPrice(auction.currentBid)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">🎉 Won</span>
                            <Link href={`/auctions/${auction.id}`} className="text-purple-600 hover:underline text-sm font-medium">
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}