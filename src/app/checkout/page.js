'use client';

// ─── FLOW: Browse artworks → Cart (/cart) → HERE (/checkout) → Order Confirmation
// ─── This page handles STANDARD purchases only (items added to cart).
// ─── Auction winners use a completely separate page: /auctions/checkout?auctionId=XXX

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
  { id: 'paypal',      label: 'PayPal',               icon: '🅿️', description: 'Pay with your PayPal account' },
  { id: 'eft',         label: 'EFT / Bank Transfer',  icon: '🏦', description: 'Direct bank transfer' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive' },
];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, cartLoaded, clearCart, getCartTotal } = useCart();
  const router = useRouter();

  const [selectedPayment, setSelectedPayment] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // Guard: must be logged in with items in cart
  useEffect(() => {
    if (authLoading || !cartLoaded) return;
    if (!user) { router.push('/login?redirect=/checkout'); return; }
    if (cart.length === 0 && !placing) { router.push('/artworks'); return; }
  }, [authLoading, cartLoaded, user, cart, placing, router]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price || 0);

  const handlePlaceOrder = async () => {
    if (!selectedPayment) { setError('Please select a payment method'); return; }

    setError('');
    setPlacing(true);

    try {
      // Build order items from cart
      const items = cart.map((item) => ({
        artworkId: item.id,
        title:     item.title,
        artist:    item.artist,
        imageUrl:  item.imageUrl || '',
        price:     item.price,
      }));

      const orderId = await createOrder({
        userId:        user.uid,
        userEmail:     user.email,
        type:          'standard',        // ← clearly marks this as a standard (non-auction) purchase
        items,
        total:         getCartTotal(),
        paymentMethod: selectedPayment,
        status:        'completed',
        itemCount:     cart.length,
      });

      // Mark each artwork as sold
      await Promise.all(
        cart.map((item) =>
          updateDoc(doc(db, 'artworks', item.id), { status: 'sold' })
        )
      );

      clearCart();
      router.push(`/orderConfirmation?orderId=${orderId}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);
  const total = getCartTotal();

  if (authLoading || !cartLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 text-foreground">
      <div className="container max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <div
            className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: 'rgba(100,160,255,0.45)', background: 'rgba(100,160,255,0.10)', color: 'var(--text-primary)' }}
          >
            🛒 Standard Checkout
          </div>
          <h1 className="font-display text-4xl font-black">Complete Your Order</h1>
          <p className="mt-1 text-muted-foreground">
            Review your items and choose a payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — items + payment */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cart items review */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Items in your order</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.imageUrl || '/Images/placeholder.jpg'}
                      alt={item.title}
                      className="h-16 w-16 rounded-xl object-cover border border-border flex-shrink-0"
                      onError={(e) => { e.target.src = '/Images/placeholder.jpg'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">by {item.artist}</p>
                      {item.medium && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{item.medium}</p>
                      )}
                    </div>
                    <span className="font-display text-lg font-black text-primary flex-shrink-0">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <Link href="/cart" className="text-sm text-primary hover:opacity-80 font-medium">
                  ← Edit cart
                </Link>
              </div>
            </div>

            {/* Payment methods */}
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
                          ? 'border-[rgba(100,160,255,0.85)] bg-[rgba(100,160,255,0.10)]'
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

          {/* Right — order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm gap-3">
                    <span className="text-muted-foreground truncate flex-1">{item.title}</span>
                    <span className="font-medium text-foreground flex-shrink-0">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-[rgba(190,255,210,0.95)]">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {selectedMethod && (
                <div className="rounded-xl border border-[rgba(100,160,255,0.45)] bg-[rgba(100,160,255,0.10)] p-3 mb-4">
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
                className="w-full rounded-full py-4 font-semibold text-base transition
                           bg-primary text-primary-foreground hover:brightness-110
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing ? 'Placing Order…' : `Pay ${formatPrice(total)}`}
              </button>

              <Link
                href="/cart"
                className="block text-center font-medium mt-4 transition text-primary hover:opacity-80 text-sm"
              >
                ← Back to cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}