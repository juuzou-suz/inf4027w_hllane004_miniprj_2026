"use client";

import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/lib/firestore";

export default function ArtworkCard({ artwork, auction, onAddToCart }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();

  const isInAuction = auction && (auction.status === "live" || auction.status === "upcoming");
  const href = isInAuction ? `/auctions/${auction.id}` : `/artworks/${artwork.id}`;

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const priceValue = isInAuction ? auction?.currentBid : artwork?.price ?? artwork?.startingBid;

  const wishlistIds = useMemo(() => {
    const raw = user?.wishlist;
    if (!Array.isArray(raw)) return [];

    // Wishlist should be stored as IDs; tolerate legacy object entries if they exist.
    return raw
      .map((x) => (typeof x === "string" ? x : x?.id || x?.artworkId))
      .filter(Boolean);
  }, [user?.wishlist]);

  const isWishlisted = useMemo(() => {
    return Boolean(artwork?.id && wishlistIds.includes(artwork.id));
  }, [wishlistIds, artwork?.id]);

  const [wishWorking, setWishWorking] = useState(false);

  const buildRedirectUrl = () => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const handleToggleWishlist = async (e) => {
    // Prevent Link navigation when interacting with the wishlist control.
    e.preventDefault();
    e.stopPropagation();

    if (!artwork?.id) return;

    // If unauthenticated, send the user to sign in and preserve wishlist intent.
    if (!user?.uid) {
      const redirect = encodeURIComponent(buildRedirectUrl());
      const wish = encodeURIComponent(artwork.id);
      router.push(`/login?redirect=${redirect}&wish=${wish}`);
      return;
    }

    if (wishWorking) return;
    setWishWorking(true);

    try {
      const next = isWishlisted
        ? wishlistIds.filter((id) => id !== artwork.id)
        : [...wishlistIds, artwork.id];

      await updateUser(user.uid, { wishlist: next });

      // Refresh auth context so dependent UI (e.g., profile) updates immediately.
      if (typeof refreshUser === "function") {
        await refreshUser();
      }
    } catch (err) {
      console.error("Wishlist update failed:", err);
    } finally {
      setWishWorking(false);
    }
  };

  return (
    <Link href={href} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={artwork?.imageUrl || "/Images/placeholder.png"}
            alt={artwork?.title || "Artwork"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "/Images/placeholder.png";
            }}
          />

          {/* Wishlist */}
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={handleToggleWishlist}
            disabled={wishWorking}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/70 backdrop-blur transition hover:bg-background disabled:opacity-60"
          >
            <Heart size={18} className={isWishlisted ? "fill-primary text-primary" : "text-foreground"} />
          </button>

          {isInAuction && (
            <span className="absolute left-3 top-3 rounded-full bg-[rgba(160,106,75,0.95)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow">
              Live auction
            </span>
          )}

          {artwork?.status === "sold" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <span className="rounded-full bg-card px-4 py-1.5 text-xs font-bold uppercase text-foreground">
                Sold
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 font-display text-lg font-semibold text-foreground">
            {artwork?.title || "Untitled"}
          </h3>

          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{artwork?.artist || "—"}</p>

          {/* Tags */}
          <div className="mt-3 flex min-h-[28px] flex-wrap gap-1.5">
            {artwork?.style && (
              <span className="rounded-full bg-[rgba(160,106,75,0.18)] px-2.5 py-0.5 text-xs text-primary">
                {artwork.style}
              </span>
            )}

            {artwork?.medium && (
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2.5 py-0.5 text-xs text-muted-foreground">
                {artwork.medium}
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* Price + action */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                {isInAuction ? "Current bid" : "Price"}
              </span>

              <span className="font-display text-lg font-bold text-primary">{formatPrice(priceValue)}</span>
            </div>

            {artwork?.status !== "sold" && !isInAuction && (
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart?.(artwork);
                }}
              >
                <ShoppingCart size={14} />
                Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}