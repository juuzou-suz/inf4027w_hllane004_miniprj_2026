'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Don't render admin panel if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Helper to check if link is active
  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Admin Panel
            </h2>
            <p className="text-sm text-gray-600">
              {user.email}
            </p>
          </div>

          <nav className="px-4 pb-4">
            <Link
              href="/admin"
              className={`block px-4 py-3 rounded-lg mb-2 transition ${
                pathname === '/admin'
                  ? 'bg-purple-100 text-purple-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 Dashboard
            </Link>

            <Link
              href="/admin/artworks"
              className={`block px-4 py-3 rounded-lg mb-2 transition ${
                isActive('/admin/artworks')
                  ? 'bg-purple-100 text-purple-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🎨 Artworks
            </Link>

            <Link
              href="/admin/auctions"
              className={`block px-4 py-3 rounded-lg mb-2 transition ${
                isActive('/admin/auctions')
                  ? 'bg-purple-100 text-purple-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              ⚡ Auctions
            </Link>

            <Link
              href="/admin/reports"
              className={`block px-4 py-3 rounded-lg mb-2 transition ${
                isActive('/admin/reports')
                  ? 'bg-purple-100 text-purple-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📈 Reports
            </Link>

            <div className="border-t border-gray-200 my-4"></div>

            <Link
              href="/"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              ← Back to Site
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}