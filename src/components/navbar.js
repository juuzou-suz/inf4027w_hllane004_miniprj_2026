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
    <nav className="sticky top-0 z-50 border-b" style={{ 
      background: 'var(--surface)', 
      borderColor: 'var(--border)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-semibold" style={{ 
              color: 'var(--text-primary)',
              letterSpacing: '0.05em'
            }}>
              CURATE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isCustomer && (
              <>
                <Link 
                  href="/" 
                  className="text-sm font-medium transition-colors"
                  style={{ 
                    color: isActive('/') ? 'var(--clay)' : 'var(--text-muted)',
                    letterSpacing: '0.03em'
                  }}
                >
                  HOME
                </Link>
                <Link 
                  href="/artworks" 
                  className="text-sm font-medium transition-colors"
                  style={{ 
                    color: isActivePrefix('/artworks') ? 'var(--clay)' : 'var(--text-muted)',
                    letterSpacing: '0.03em'
                  }}
                >
                  ARTWORKS
                </Link>
                <Link 
                  href="/auctions" 
                  className="text-sm font-medium transition-colors"
                  style={{ 
                    color: isActivePrefix('/auctions') ? 'var(--clay)' : 'var(--text-muted)',
                    letterSpacing: '0.03em'
                  }}
                >
                  AUCTIONS
                </Link>
                <Link 
                  href="/profile" 
                  className="text-sm font-medium transition-colors"
                  style={{ 
                    color: isActivePrefix('/profile') ? 'var(--clay)' : 'var(--text-muted)',
                    letterSpacing: '0.03em'
                  }}
                >
                  PROFILE
                </Link>
              </>
            )}

            {isGuest && (
              <>
                <Link 
                  href="/" 
                  className="text-sm font-medium transition-colors"
                  style={{ 
                    color: isActive('/') ? 'var(--clay)' : 'var(--text-muted)',
                    letterSpacing: '0.03em'
                  }}
                >
                  HOME
                </Link>
                <Link 
                  href="/artworks" 
                  className="text-sm font-medium transition-colors"
                  style={{ 
                    color: isActivePrefix('/artworks') ? 'var(--clay)' : 'var(--text-muted)',
                    letterSpacing: '0.03em'
                  }}
                >
                  ARTWORKS
                </Link>
                <Link 
                  href="/auctions" 
                  className="text-sm font-medium transition-colors"
                  style={{ 
                    color: isActivePrefix('/auctions') ? 'var(--clay)' : 'var(--text-muted)',
                    letterSpacing: '0.03em'
                  }}
                >
                  AUCTIONS
                </Link>
              </>
            )}
          </div>

          {/* Desktop Right Side: Cart + Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAdmin && (
              <Link href="/cart" className="relative p-2">
                <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" style={{
                    background: 'var(--clay)',
                    color: '#F5EFE6'
                  }}>
                    {getCartCount()}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                {isCustomer && (
                  <Link href="/profile" className="text-sm max-w-[150px] truncate transition-colors" style={{ color: 'var(--text-muted)' }}>
                    {user.email}
                  </Link>
                )}
                <button 
                  onClick={logout} 
                  className="px-4 py-2 text-xs font-semibold border transition-colors"
                  style={{
                    background: 'transparent',
                    color: 'var(--clay)',
                    borderColor: 'var(--clay)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: '2px'
                  }}
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>
                  Log In
                </Link>
                <Link 
                  href="/register" 
                  className="px-4 py-2 text-xs font-semibold"
                  style={{
                    background: 'var(--clay)',
                    color: '#F5EFE6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: '2px'
                  }}
                >
                  REGISTER
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2"
            style={{ color: 'var(--text-primary)' }}
          >
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
          <div className="md:hidden py-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
            {isCustomer && (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>HOME</Link>
                <Link href="/artworks" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>ARTWORKS</Link>
                <Link href="/auctions" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>AUCTIONS</Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>PROFILE</Link>
                <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>
                  CART {getCartCount() > 0 && `(${getCartCount()})`}
                </Link>
              </>
            )}
            {isGuest && (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>HOME</Link>
                <Link href="/artworks" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>ARTWORKS</Link>
                <Link href="/auctions" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>AUCTIONS</Link>
                <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="block font-medium py-1" style={{ color: 'var(--text-muted)' }}>CART</Link>
              </>
            )}
            <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              {user ? (
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }} 
                  className="w-full px-4 py-2 font-semibold"
                  style={{
                    background: 'var(--clay)',
                    color: '#F5EFE6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.875rem',
                    borderRadius: '2px'
                  }}
                >
                  LOGOUT
                </button>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center font-medium py-2" style={{ color: 'var(--text-muted)' }}>
                    Log In
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block text-center px-4 py-2 font-semibold"
                    style={{
                      background: 'var(--clay)',
                      color: '#F5EFE6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.875rem',
                      borderRadius: '2px'
                    }}
                  >
                    REGISTER
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}