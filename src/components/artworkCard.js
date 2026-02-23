'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function ArtworkCard({ artwork, auction, onAddToCart }) {
  const isInAuction = auction && (auction.status === 'live' || auction.status === 'upcoming');

  const href = isInAuction ? `/auctions/${auction.id}` : `/artworks/${artwork.id}`;

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price || 0);

  const priceValue = isInAuction ? auction?.currentBid : artwork?.price ?? artwork?.startingBid;

  return (
    <Link href={href} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg">
        {/* IMAGE (Fixed Ratio) */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={artwork.imageUrl || 'https://via.placeholder.com/600x750?text=No+Image'}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {isInAuction && (
            <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider
                             bg-[rgba(160,106,75,0.95)] text-primary-foreground shadow">
              Live Auction
            </span>
          )}

          {artwork.status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <span className="rounded-full px-4 py-1.5 text-xs font-bold uppercase bg-card text-foreground">
                Sold
              </span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-lg font-semibold line-clamp-2 text-foreground">
            {artwork.title}
          </h3>

          <p className="mt-1 text-sm line-clamp-1 text-muted-foreground">
            {artwork.artist}
          </p>

          {/* Tags */}
          <div className="mt-3 min-h-[28px] flex flex-wrap gap-1.5">
            {artwork.style && (
              <span className="rounded-full px-2.5 py-0.5 text-xs
                               bg-[rgba(160,106,75,0.18)] text-primary">
                {artwork.style}
              </span>
            )}

            {artwork.medium && (
              <span className="rounded-full px-2.5 py-0.5 text-xs
                               bg-[rgba(255,255,255,0.06)] text-muted-foreground">
                {artwork.medium}
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* PRICE + BUTTON */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                {isInAuction ? 'Current bid' : 'Price'}
              </span>

              <span className="font-display text-lg font-bold text-primary">
                {formatPrice(priceValue)}
              </span>
            </div>

            {artwork.status !== 'sold' && !isInAuction && (
              <button
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold
                           bg-primary text-primary-foreground transition-all hover:brightness-110"
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