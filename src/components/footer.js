'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (user?.role === 'admin' || pathname.startsWith('/admin')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md"
    >
      <div className="container py-6">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-2">
            <h3
              className="font-display text-xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Curate
            </h3>

            <p
              className="mt-3 max-w-sm text-sm leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              A home for contemporary African art. Discover, collect, and support emerging artists redefining modern expression.
            </p>

            <p
              className="mt-3 text-xs"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            >
              UCT INF4027W Web Development Mini Project
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Explore
            </h4>

            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:opacity-70">Home</Link>
              <Link href="/artworks" className="hover:opacity-70">Artworks</Link>
              <Link href="/auctions" className="hover:opacity-70">Auctions</Link>
            </nav>
          </div>

          {/* Account */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Account
            </h4>

            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/login" className="hover:opacity-70">Log In</Link>
              <Link href="/register" className="hover:opacity-70">Register</Link>
              <Link href="/profile" className="hover:opacity-70">Dashboard</Link>
            </nav>
          </div>
        </div>

        {/* Bottom line */}
        <div
          className="mt-10 border-t pt-6 text-xs"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          © {currentYear} Curate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}