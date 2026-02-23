'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/firestore';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️', description: 'Pay with your PayPal account' },
  { id: 'eft', label: 'EFT / Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive' },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const router = useRouter();

  const [selectedPayment, setSelectedPayment] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) router.push('/login?redirect=/checkout');
  }, [user, router]);

  useEffect(() => {
    if (cart.length === 0 && !placing) router.push('/artworks');
  }, [cart, placing, router]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      setError('Please select a payment method');
      return;
    }

    setError('');
    setPlacing(true);

    try {
      const items = cart.map((item) => ({
        artworkId: item.id,
        title: item.title,
        artist: item.artist,
        imageUrl: item.imageUrl || '',
        price: item.price,
      }));

      const orderId = await createOrder({
        userId: user.uid,
        userEmail: user.email,
        items,
        total: getCartTotal(),
        paymentMethod: selectedPayment,
        status: 'completed',
        itemCount: cart.length,
      });

      await Promise.all(cart.map((item) => updateDoc(doc(db, 'artworks', item.id), { status: 'sold' })));

      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  if (!user) return null;

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);

  return (
    <div className="min-h-screen bg-background py-12 text-foreground">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">
                Your Items <span className="text-muted-foreground font-medium">({cart.length})</span>
              </h2>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/80x80'}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-xl border border-border"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">by {item.artist}</p>
                    </div>
                    <p className="font-display font-black text-primary">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

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
                        'p-4 rounded-2xl border text-left transition',
                        'hover:bg-[rgba(255,255,255,0.04)]',
                        active
                          ? 'border-[rgba(160,106,75,0.85)] bg-[rgba(160,106,75,0.12)]'
                          : 'border-border bg-transparent',
                      ].join(' ')}
                    >
                      <div className="text-3xl mb-2">{method.icon}</div>
                      <div className="font-semibold text-foreground">{method.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{method.description}</div>
                      {active && (
                        <div className="mt-2 text-primary text-sm font-semibold">
                          ✓ Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Simulation Notice */}
              <div className="mt-4 rounded-xl border border-[rgba(140,180,255,0.35)] bg-[rgba(140,180,255,0.10)] p-3">
                <p className="text-sm text-[rgba(210,230,255,0.95)]">
                  💡 Payment is simulated — no real transaction will occur. Simply select a method and place your order.
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6 sticky top-6 shadow-lg">
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

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatPrice(getCartTotal())}</span>
                </div>

                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-[rgba(190,255,210,0.95)]">Free</span>
                </div>

                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              {/* Selected Payment Badge */}
              {selectedMethod && (
                <div className="rounded-xl border border-[rgba(160,106,75,0.45)] bg-[rgba(160,106,75,0.10)] p-3 mb-4">
                  <p className="text-sm text-foreground font-semibold">
                    {selectedMethod.icon} {selectedMethod.label}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.18)] px-3 py-2 mb-4 text-sm text-[rgba(255,225,225,0.95)]">
                  {error}
                </div>
              )}

              {/* Place Order */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedPayment}
                className="w-full rounded-full py-4 font-semibold text-base transition
                           bg-primary text-primary-foreground hover:brightness-110
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>

              <Link
                href="/cart"
                className="block text-center font-medium mt-4 transition text-primary hover:opacity-80"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}