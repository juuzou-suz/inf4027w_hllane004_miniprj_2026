'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function ArtworkCard({ artwork, auction, onAddToCart }) {
  const isInAuction =
    auction && (auction.status === 'live' || auction.status === 'upcoming');

  const href = isInAuction
    ? `/auctions/${auction.id}`
    : `/artworks/${artwork.id}`;

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price || 0);

  const priceValue = isInAuction
    ? auction?.currentBid
    : artwork?.price ?? artwork?.startingBid;

  return (
    <Link href={href} className="group block h-full">
      <div
        className="flex h-full flex-col overflow-hidden rounded-xl transition-shadow duration-300"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* IMAGE (Fixed Ratio) */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={artwork.imageUrl || 'https://via.placeholder.com/600x750?text=No+Image'}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {isInAuction && (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                background: 'var(--forest)',
                color: '#F5EFE6',
              }}
            >
              Live Auction
            </span>
          )}

          {artwork.status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span
                className="rounded-full px-4 py-1.5 text-xs font-bold uppercase"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              >
                Sold
              </span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col p-4">
          {/* Title (clamped to 2 lines) */}
          <h3
            className="font-display text-lg font-semibold line-clamp-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {artwork.title}
          </h3>

          {/* Artist (1 line only) */}
          <p
            className="mt-1 text-sm line-clamp-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {artwork.artist}
          </p>

          {/* Tags (max 2 shown, fixed height space) */}
          <div className="mt-3 min-h-[28px] flex flex-wrap gap-1.5">
            {artwork.style && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{
                  background: 'rgba(140, 90, 60, 0.12)',
                  color: 'var(--clay)',
                }}
              >
                {artwork.style}
              </span>
            )}

            {artwork.medium && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{
                  background: 'rgba(46, 42, 39, 0.08)',
                  color: 'var(--text-muted)',
                }}
              >
                {artwork.medium}
              </span>
            )}
          </div>

          {/* Spacer pushes price to bottom */}
          <div className="flex-1" />

          {/* PRICE + BUTTON */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span
                className="block text-xs uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {isInAuction ? 'Current bid' : 'Price'}
              </span>

              <span
                className="font-display text-lg font-bold"
                style={{ color: 'var(--clay)' }}
              >
                {formatPrice(priceValue)}
              </span>
            </div>

            {artwork.status !== 'sold' && !isInAuction && (
              <button
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:brightness-110"
                style={{
                  background: 'var(--clay)',
                  color: '#F5EFE6',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (onAddToCart) onAddToCart(artwork);
                }}
              >
                <ShoppingCart size={14} />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}