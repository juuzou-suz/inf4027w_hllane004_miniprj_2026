'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer for admins and on admin pages
  if (user?.role === 'admin' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🎨</span>
              <span className="text-2xl font-bold text-white">Curate</span>
            </div>
            <p className="text-gray-400 mb-4">
              Bringing emerging artists and art collectors together through
              real-time online auctions.
            </p>
            <p className="text-sm text-gray-500">
              UCT INF4027W Web Development Mini Project
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-purple-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/artworks" className="hover:text-purple-400 transition">
                  Artworks
                </Link>
              </li>
              <li>
                <Link href="/auctions" className="hover:text-purple-400 transition">
                  Auctions
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-purple-400 transition">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-purple-400 transition">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-purple-400 transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {currentYear} Curate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}