'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  // Get current user and logout function
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  // Get current path (to highlight active link)
  const pathname = usePathname();
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper function to check if link is active
  const isActive = (path) => pathname === path;
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎨</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Curate
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium transition ${
                isActive('/')
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Home
            </Link>
            
            <Link
              href="/artworks"
              className={`font-medium transition ${
                isActive('/artworks')
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Artworks
            </Link>
            
            <Link
              href="/auctions"
              className={`font-medium transition ${
                isActive('/auctions')
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Auctions
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`font-medium transition ${
                  isActive('/dashboard')
                    ? 'text-purple-600'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                Dashboard
              </Link>
            )}

            {/* Admin Link - Only show for admin users */}
            {user && user.role === 'admin' && (
              <Link
                href="/admin"
                className={`font-medium transition ${
                  isActive('/admin')
                    ? 'text-purple-600'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
          {/* Cart Icon - Only show for customers and guests */}
{!isAdmin && (
  <Link href="/cart" className="relative">
    <svg className="w-6 h-6 text-gray-700 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    {getCartCount() > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {getCartCount()}
      </span>
    )}
  </Link>
)}

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-purple-600 font-medium transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              // Close icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Menu icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium ${
                  isActive('/') ? 'text-purple-600' : 'text-gray-700'
                }`}
              >
                Home
              </Link>
              
              <Link
                href="/artworks"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium ${
                  isActive('/artworks') ? 'text-purple-600' : 'text-gray-700'
                }`}
              >
                Artworks
              </Link>
              
              <Link
                href="/auctions"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium ${
                  isActive('/auctions') ? 'text-purple-600' : 'text-gray-700'
                }`}
              >
                Auctions
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-medium ${
                    isActive('/dashboard') ? 'text-purple-600' : 'text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
              )}

              {user && user.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-medium ${
                    isActive('/admin') ? 'text-purple-600' : 'text-gray-700'
                  }`}
                >
                  Admin
                </Link>
              )}

              <div className="border-t border-gray-200 pt-4">
                {user ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      {user.email}
                    </p>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center text-gray-700 hover:text-purple-600 font-medium"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}