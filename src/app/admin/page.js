'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalArtworks: 0,
    availableArtworks: 0,
    totalAuctions: 0,
    liveAuctions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch artworks
      const artworks = await getAllArtworks();
      const availableArtworks = artworks.filter(a => a.status === 'available');
      
      // Fetch auctions (will return empty array if collection doesn't exist yet)
      let auctions = [];
      try {
        auctions = await getAllAuctions();
      } catch (error) {
        console.log('No auctions yet');
      }
      const liveAuctions = auctions.filter(a => a.status === 'live');

      setStats({
        totalArtworks: artworks.length,
        availableArtworks: availableArtworks.length,
        totalAuctions: auctions.length,
        liveAuctions: liveAuctions.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome to the admin panel. Manage your artworks and auctions here.
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Artworks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🎨</div>
              <div className="text-sm font-medium text-gray-600">Total</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalArtworks}
            </div>
            <div className="text-sm text-gray-600">
              Artworks
            </div>
          </div>

          {/* Available Artworks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">✅</div>
              <div className="text-sm font-medium text-gray-600">Ready</div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.availableArtworks}
            </div>
            <div className="text-sm text-gray-600">
              Available
            </div>
          </div>

          {/* Total Auctions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⚡</div>
              <div className="text-sm font-medium text-gray-600">All Time</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalAuctions}
            </div>
            <div className="text-sm text-gray-600">
              Auctions
            </div>
          </div>

          {/* Live Auctions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🔴</div>
              <div className="text-sm font-medium text-gray-600">Active</div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {stats.liveAuctions}
            </div>
            <div className="text-sm text-gray-600">
              Live Now
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/artworks/new"
            className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition"
          >
            <div className="text-3xl mr-4">➕</div>
            <div>
              <div className="font-semibold text-gray-900">Add Artwork</div>
              <div className="text-sm text-gray-600">Create new artwork listing</div>
            </div>
          </Link>

          <Link
            href="/admin/artworks"
            className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
          >
            <div className="text-3xl mr-4">📋</div>
            <div>
              <div className="font-semibold text-gray-900">Manage Artworks</div>
              <div className="text-sm text-gray-600">View and edit artworks</div>
            </div>
          </Link>

          <Link
            href="/admin/auctions"
            className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition"
          >
            <div className="text-3xl mr-4">⚡</div>
            <div>
              <div className="font-semibold text-gray-900">Create Auction</div>
              <div className="text-sm text-gray-600">Schedule new auction</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}