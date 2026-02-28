'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Hide footer in admin experience
  if (user?.role === 'admin' || pathname.startsWith('/admin')) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container py-10">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-bold text-foreground">Curate.</h3>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A home for contemporary African art. Discover, collect, and support emerging artists redefining modern
              expression. Bid in real time.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Explore
            </h4>

            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/" className="text-foreground/90 hover:text-primary transition-colors">Home</Link>
              <Link href="/artworks" className="text-foreground/90 hover:text-primary transition-colors">Collection</Link>
              <Link href="/auctions" className="text-foreground/90 hover:text-primary transition-colors">Auctions</Link>
            </nav>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Account
            </h4>

            <nav className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/login" className="text-foreground/90 hover:text-primary transition-colors">Log in</Link>
              <Link href="/register" className="text-foreground/90 hover:text-primary transition-colors">Create account</Link>
              <Link href="/profile" className="text-foreground/90 hover:text-primary transition-colors">Profile</Link>
            </nav>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {currentYear} Curate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}