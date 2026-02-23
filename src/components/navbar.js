'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isActive = (path) => pathname === path;
  const isActivePrefix = (path) => pathname.startsWith(path);

  const displayName = user?.name?.trim() || user?.displayName?.trim() || user?.email || '';
  const profileHref = user ? '/profile' : '/login?redirect=/profile';

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display text-2xl font-bold text-foreground tracking-tight">
          Curate.
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 font-sans text-sm md:flex">
          <Link
            href="/"
            className={`font-medium transition-colors hover:text-primary ${
              isActive('/') ? 'text-primary' : 'text-foreground'
            }`}
          >
            Home
          </Link>

          <Link
            href="/artworks"
            className={`font-medium transition-colors hover:text-primary ${
              isActivePrefix('/artworks') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Artworks
          </Link>

          <Link
            href="/auctions"
            className={`font-medium transition-colors hover:text-primary ${
              isActivePrefix('/auctions') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Auctions
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Cart + Profile icons — non-admin only */}
          {!isAdmin && (
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                className="relative text-foreground transition-colors hover:text-primary"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
                {getCartCount() > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-sans text-[10px] font-bold text-primary-foreground">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* ✅ Always show Profile icon (logged in or not) */}
              <Link
                href={profileHref}
                className="text-foreground transition-colors hover:text-primary"
                aria-label="Profile"
                title={user ? 'Profile' : 'Sign in to view profile'}
              >
                <UserIcon size={20} />
              </Link>
            </div>
          )}

          {/* Auth (Desktop) */}
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              {!isAdmin && (
                <span className="max-w-[160px] truncate font-sans text-sm text-muted-foreground">
                  {displayName}
                </span>
              )}

              <button
                onClick={logout}
                className="rounded-full border border-border px-5 py-2 font-sans text-sm font-semibold text-foreground transition-all hover:bg-[rgba(255,255,255,0.06)]"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-primary px-5 py-2 font-sans text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 md:inline-block"
            >
              Sign In
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            className="text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t border-border bg-background px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4 font-sans text-base">
            <Link href="/" className="font-medium text-foreground" onClick={() => setOpen(false)}>
              Collection
            </Link>

            <Link
              href="/auctions"
              className={isActivePrefix('/auctions') ? 'text-foreground' : 'text-muted-foreground'}
              onClick={() => setOpen(false)}
            >
              Auctions
            </Link>

            <Link
              href="/artworks"
              className={isActivePrefix('/artworks') ? 'text-foreground' : 'text-muted-foreground'}
              onClick={() => setOpen(false)}
            >
              Artworks
            </Link>

            {!isAdmin && (
              <Link href="/cart" className="text-muted-foreground" onClick={() => setOpen(false)}>
                Cart {getCartCount() > 0 && `(${getCartCount()})`}
              </Link>
            )}

            {/* ✅ Always show Profile in mobile menu too (consistent) */}
            {!isAdmin && (
              <Link href={profileHref} className="text-muted-foreground" onClick={() => setOpen(false)}>
                Profile
              </Link>
            )}

            <div className="mt-2 border-t border-border pt-4">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="w-full rounded-full border border-border py-2.5 font-sans text-sm font-semibold text-foreground transition hover:bg-[rgba(255,255,255,0.06)]"
                >
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-full bg-primary px-5 py-2.5 text-center font-sans text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}