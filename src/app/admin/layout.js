'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const isActive = (path) =>
    path === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(path);

  const navLinks = [
    { href: '/admin', label: '📊 Dashboard' },
    { href: '/admin/artworks', label: '🎨 Artworks' },
    { href: '/admin/auctions', label: '⚡ Auctions' },
    { href: '/admin/orders', label: '📦 Orders' },
    { href: '/admin/reports', label: '📈 Reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md min-h-screen flex flex-col fixed top-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">🎨</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Curate Admin
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-4 py-3 rounded-lg transition font-medium ${
                isActive(link.href)
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="px-4 py-6 border-t border-gray-200 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition font-medium"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content - offset by sidebar width */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}