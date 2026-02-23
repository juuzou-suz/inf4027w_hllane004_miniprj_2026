'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getArtworkById } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ArtworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const artworkId = params.id;

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (artworkId) fetchArtwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId]);

  const fetchArtwork = async () => {
    try {
      setLoading(true);

      const artworkData = await getArtworkById(artworkId);

      if (!artworkData) {
        setError('Artwork not found');
        setLoading(false);
        return;
      }

      // Check if artwork is in ANY auction
      const auctionsQuery = query(collection(db, 'auctions'), where('artworkId', '==', artworkId));
      const auctionSnapshot = await getDocs(auctionsQuery);

      if (!auctionSnapshot.empty) {
        const auctionId = auctionSnapshot.docs[0].id;
        router.replace(`/auctions/${auctionId}`);
        return;
      }

      setArtwork(artworkData);
      setError('');
    } catch (err) {
      console.error('Error fetching artwork:', err);
      setError('Failed to load artwork details.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);

  const handleAddToCart = () => {
    if (!user) {
      const redirectUrl = encodeURIComponent(`/artworks/${artworkId}`);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }
    addToCart(artwork);
    alert(`"${artwork.title}" has been added to your cart!`);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  // Error / Not found
  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-background py-12 text-foreground">
        <div className="container">
          <div className="rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] p-8 text-center">
            <h2 className="text-2xl font-bold text-[rgba(255,225,225,0.95)] mb-3">
              {error || 'Artwork Not Found'}
            </h2>
            <p className="text-sm text-[rgba(255,225,225,0.85)] mb-6">
              The artwork you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/artworks"
              className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
            >
              Back to Artworks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAvailableToBuy = artwork.status === 'available' && artwork.price;

  return (
    <div className="min-h-screen bg-background py-12 text-foreground">
      <div className="container">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          Back
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Section */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src={artwork.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'}
              alt={artwork.title}
              className="w-full h-auto"
            />
          </div>

          {/* Details Section */}
          <div>
            <h1 className="font-display text-4xl font-black mb-2">{artwork.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">by {artwork.artist}</p>

            {/* Price Box */}
            {artwork.price && (
              <div className="rounded-2xl border border-[rgba(160,106,75,0.55)] bg-[rgba(160,106,75,0.10)] p-6 mb-8">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Price</div>
                <div className="font-display text-4xl font-black text-primary">
                  {formatPrice(artwork.price)}
                </div>
              </div>
            )}

            {/* Artwork Details */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Artwork Details</h2>

              <div className="space-y-3 text-sm">
                <DetailRow label="Style" value={artwork.style} />
                <DetailRow label="Medium" value={artwork.medium} />

                {artwork.dimensions && (
                  <DetailRow
                    label="Dimensions"
                    value={`${artwork.dimensions.width} × ${artwork.dimensions.height}${
                      artwork.dimensions.depth ? ` × ${artwork.dimensions.depth}` : ''
                    } cm`}
                  />
                )}

                {artwork.yearCreated && <DetailRow label="Year" value={artwork.yearCreated} />}
              </div>
            </div>

            {/* Description */}
            {artwork.description && (
              <div className="rounded-2xl border border-border bg-card p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {artwork.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold
                               bg-[rgba(255,255,255,0.06)] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action */}
            {isAvailableToBuy ? (
              <button
                onClick={handleAddToCart}
                className="w-full rounded-full px-6 py-4 text-center text-base font-semibold
                           bg-primary text-primary-foreground hover:brightness-110 transition"
              >
                Add to Cart
              </button>
            ) : artwork.status === 'sold' ? (
              <div className="text-center p-6 rounded-2xl border border-border bg-card">
                <p className="text-foreground font-medium">This artwork has been sold</p>
                <p className="mt-1 text-sm text-muted-foreground">Check out other available works.</p>
              </div>
            ) : (
              <div className="text-center p-6 rounded-2xl border border-border bg-card">
                <p className="text-foreground font-medium">This artwork is currently unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">It may be in review or temporarily hidden.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground text-right">{value || '—'}</span>
    </div>
  );
}