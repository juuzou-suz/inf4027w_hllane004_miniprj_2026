'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isCustomer = user && !isAdmin;
  const isGuest = !user;

  const isActive = (path) => pathname === path;
  const isActivePrefix = (path) => pathname.startsWith(path);

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">

            {/* CUSTOMER NAVIGATION */}
            {isCustomer && (
              <>
                <Link href="/" className={`font-medium transition ${isActive('/') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Home
                </Link>
                <Link href="/artworks" className={`font-medium transition ${isActivePrefix('/artworks') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Artworks
                </Link>
                <Link href="/auctions" className={`font-medium transition ${isActivePrefix('/auctions') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Auctions
                </Link>
                <Link href="/profile" className={`font-medium transition ${isActivePrefix('/profile') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Profile
                </Link>
              </>
            )}

            {/* GUEST NAVIGATION */}
            {isGuest && (
              <>
                <Link href="/" className={`font-medium transition ${isActive('/') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Home
                </Link>
                <Link href="/artworks" className={`font-medium transition ${isActivePrefix('/artworks') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Artworks
                </Link>
                <Link href="/auctions" className={`font-medium transition ${isActivePrefix('/auctions') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}>
                  Auctions
                </Link>
              </>
            )}
          </div>

          {/* Desktop Right Side: Cart + Auth */}
          <div className="hidden md:flex items-center space-x-4">

            {/* Cart Icon - Customers and Guests only */}
            {!isAdmin && (
              <Link href="/cart" className="relative p-1">
                <svg className="w-6 h-6 text-gray-700 hover:text-purple-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {getCartCount()}
                  </span>
                )}
              </Link>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-3">
                {isCustomer && (
                  <Link href="/profile" className="text-sm text-gray-600 hover:text-purple-600 max-w-[150px] truncate transition">
                    {user.email}
                  </Link>
                )}
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium text-sm">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-gray-700 hover:text-purple-600 font-medium transition">
                  Log In
                </Link>
                <Link href="/register" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 space-y-3">
            {isCustomer && (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Home</Link>
                <Link href="/artworks" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Artworks</Link>
                <Link href="/auctions" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Auctions</Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Profile</Link>
                <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">
                  Cart {getCartCount() > 0 && `(${getCartCount()})`}
                </Link>
              </>
            )}
            {isGuest && (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Home</Link>
                <Link href="/artworks" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Artworks</Link>
                <Link href="/auctions" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Auctions</Link>
                <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="block font-medium text-gray-700 hover:text-purple-600 py-1">Cart</Link>
              </>
            )}
            <div className="border-t border-gray-200 pt-3">
              {user ? (
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium">
                  Logout
                </button>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center text-gray-700 hover:text-purple-600 font-medium py-2">Log In</Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium">Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}