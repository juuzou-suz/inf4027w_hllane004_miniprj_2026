'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (user?.role === 'admin' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t" style={{ 
      background: 'var(--surface)', 
      borderColor: 'var(--border)',
      color: 'var(--text-muted)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <span className="text-2xl font-semibold" style={{ 
                color: 'var(--text-primary)',
                letterSpacing: '0.05em'
              }}>
                CURATE
              </span>
            </div>
            <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Connecting emerging artists and collectors through contemporary art auctions.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
              UCT INF4027W Web Development Project
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-sm" style={{ 
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Navigate
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/artworks" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                  Artworks
                </Link>
              </li>
              <li>
                <Link href="/auctions" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                  Auctions
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-4 text-sm" style={{ 
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Account
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                  Register
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                  Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-12 pt-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            © {currentYear} Curate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}