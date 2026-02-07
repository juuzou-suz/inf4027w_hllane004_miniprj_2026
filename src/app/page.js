'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  // Get current user and logout function from AuthContext
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-purple-600">
                🎨 Curate
              </span>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              {user ? (
                // Logged in - show user email and logout button
                <>
                  <span className="text-gray-700">
                    {user.email}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                // Not logged in - show login and register buttons
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-purple-600 font-medium transition"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Hero Section */}
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Curate
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time art auctions for emerging artists
          </p>

          {/* Status Message */}
          {user ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-green-800 font-semibold mb-2">
                ✅ You are logged in!
              </p>
              <p className="text-green-700">
                Welcome back, {user.email}
              </p>
              <p className="text-sm text-green-600 mt-4">
                (Artworks and auctions coming soon in Week 1, Days 5-7)
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-blue-800 font-semibold mb-2">
                👋 Welcome, Guest!
              </p>
              <p className="text-blue-700 mb-4">
                Please log in or register to start bidding
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* Feature Preview */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Browse Artworks
              </h3>
              <p className="text-gray-600">
                Explore curated collections from emerging artists
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Live Bidding
              </h3>
              <p className="text-gray-600">
                Participate in real-time auctions with instant updates
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Smart Search
              </h3>
              <p className="text-gray-600">
                Find artworks using AI-powered recommendations
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2026 Curate - UCT INF4027W Mini Project
          </p>
        </div>
      </footer>
    </div>
  );
}