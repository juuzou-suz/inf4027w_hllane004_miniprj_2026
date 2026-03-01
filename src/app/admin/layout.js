'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const isActive = (path) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

  const navLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/artworks', label: 'Artworks' },
    { href: '/admin/auctions', label: 'Auctions' },
    { href: '/admin/orders', label: 'Orders' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside
        className="w-72 min-h-screen fixed top-0 left-0 z-40 bg-card flex flex-col"
        style={{
          boxShadow: '0 0 30px rgba(0,0,0,0.15)',
        }}
      >
        {/* Brand */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-black tracking-tight">
                Curate. Admin
              </div>
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
          </div>
        </div>
            
          {/* Horizontal divider */}
          <div
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.08)',
              margin: '0 1rem',
            }}
          />

        {/* Nav */}
        <nav className="px-3 py-2 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-4 py-3 text-sm font-semibold transition"
                style={{
                  background: active ? 'rgba(160,106,75,0.12)' : 'transparent',
                  color: active ? 'var(--clay)' : 'var(--text-primary)',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout section pinned to bottom */}
        <div className="mt-auto">
          {/* Horizontal divider */}
          <div
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.08)',
              margin: '0 1rem',
            }}
          />

          <div className="p-4">
            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition hover:brightness-110"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(250, 250, 250, 0.95)',
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-72 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}