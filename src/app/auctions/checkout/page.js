'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createOrder, getArtworkById } from '@/lib/firestore';
import Link from 'next/link';

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️', description: 'Pay with your PayPal account' },
  { id: 'eft', label: 'EFT / Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive' },
];

export default function AuctionCheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auctionId = searchParams.get('auctionId');

  const [auction, setAuction] = useState(null);
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/auctions/checkout?auctionId=${auctionId}`);
      return;
    }
    if (!auctionId) {
      router.push('/profile');
      return;
    }
    fetchData();
  }, [user, auctionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const auctionDoc = await getDoc(doc(db, 'auctions', auctionId));
      if (!auctionDoc.exists()) {
        setError('Auction not found');
        return;
      }

      const auctionData = { id: auctionDoc.id, ...auctionDoc.data() };

      // Security: only the winner can access this page
      if (auctionData.winnerId !== user.uid) {
        router.push('/profile');
        return;
      }

      // Already paid
      if (auctionData.paymentStatus === 'paid') {
        router.push(`/orderConfirmation?orderId=${auctionData.orderId}`);
        return;
      }

      setAuction(auctionData);

      const artworkData = await getArtworkById(auctionData.artworkId);
      setArtwork(artworkData);
    } catch (err) {
      console.error('Error loading auction checkout:', err);
      setError('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price || 0);

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      setError('Please select a payment method');
      return;
    }

    setError('');
    setPlacing(true);

    try {
      const orderId = await createOrder({
        userId: user.uid,
        userEmail: user.email,
        type: 'auction',
        auctionId: auction.id,
        items: [
          {
            artworkId: artwork.id,
            title: artwork.title,
            artist: artwork.artist,
            imageUrl: artwork.imageUrl || '',
            price: auction.currentBid,
          },
        ],
        total: auction.currentBid,
        paymentMethod: selectedPayment,
        status: 'completed',
        itemCount: 1,
      });

      // Mark artwork as sold
      await updateDoc(doc(db, 'artworks', artwork.id), { status: 'sold' });

      // Mark auction as paid
      await updateDoc(doc(db, 'auctions', auction.id), {
        paymentStatus: 'paid',
        orderId,
      });

      router.push(`/orderConfirmation?orderId=${orderId}`);
    } catch (err) {
      console.error('Error placing auction order:', err);
      setError('Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="min-h-screen bg-background py-12 text-foreground">
        <div className="container max-w-xl text-center">
          <p className="text-lg font-semibold text-foreground">{error}</p>
          <Link href="/profile" className="mt-4 inline-block text-sm text-primary hover:opacity-80">
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);

  return (
    <div className="min-h-screen bg-background py-12 text-foreground">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: 'rgba(160,106,75,0.45)', background: 'rgba(160,106,75,0.10)', color: 'var(--text-primary)' }}>
            🏆 Auction Won
          </div>
          <h1 className="font-display text-4xl font-black">Complete Your Purchase</h1>
          <p className="mt-1 text-muted-foreground">You won this auction — complete payment to claim the artwork.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artwork */}
            {artwork && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4">Your Won Artwork</h2>
                <div className="flex items-center gap-5">
                  <img
                    src={artwork.imageUrl || '/Images/placeholder.jpg'}
                    alt={artwork.title}
                    className="h-24 w-24 rounded-xl object-cover border border-border flex-shrink-0"
                    onError={(e) => { e.target.src = '/Images/placeholder.jpg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xl font-black text-foreground">{artwork.title}</p>
                    <p className="text-sm text-muted-foreground">by {artwork.artist}</p>
                    {artwork.medium && (
                      <p className="mt-1 text-sm text-muted-foreground">{artwork.medium}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Winning bid</span>
                      <span className="font-display text-xl font-black text-primary">
                        {formatPrice(auction?.currentBid)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-6">Select Payment Method</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const active = selectedPayment === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      type="button"
                      className={[
                        'p-4 rounded-2xl border text-left transition hover:bg-[rgba(255,255,255,0.04)]',
                        active
                          ? 'border-[rgba(160,106,75,0.85)] bg-[rgba(160,106,75,0.12)]'
                          : 'border-border bg-transparent',
                      ].join(' ')}
                    >
                      <div className="text-3xl mb-2">{method.icon}</div>
                      <div className="font-semibold text-foreground">{method.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{method.description}</div>
                      {active && (
                        <div className="mt-2 text-primary text-sm font-semibold">✓ Selected</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-[rgba(140,180,255,0.35)] bg-[rgba(140,180,255,0.10)] p-3">
                <p className="text-sm text-[rgba(210,230,255,0.95)]">
                  💡 Payment is simulated — no real transaction will occur. Simply select a method and place your order.
                </p>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground truncate flex-1">{artwork?.title}</span>
                  <span className="font-medium text-foreground flex-shrink-0">
                    {formatPrice(auction?.currentBid)}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatPrice(auction?.currentBid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-[rgba(190,255,210,0.95)]">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(auction?.currentBid)}</span>
                </div>
              </div>

              {selectedMethod && (
                <div className="rounded-xl border border-[rgba(160,106,75,0.45)] bg-[rgba(160,106,75,0.10)] p-3 mb-4">
                  <p className="text-sm text-foreground font-semibold">
                    {selectedMethod.icon} {selectedMethod.label}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.18)] px-3 py-2 mb-4 text-sm text-[rgba(255,225,225,0.95)]">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedPayment}
                className="w-full rounded-full py-4 font-semibold text-base transition bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing ? 'Placing Order…' : 'Complete Purchase'}
              </button>

              <Link
                href="/profile"
                className="block text-center font-medium mt-4 transition text-primary hover:opacity-80 text-sm"
              >
                ← Back to profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}