'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (orderId) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() });
      }
    } catch (err) {
      console.error('Error fetching order:', err);
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paymentLabels = {
    credit_card: '💳 Credit / Debit Card',
    paypal: '🅿️ PayPal',
    eft: '🏦 EFT / Bank Transfer',
    cash_on_delivery: '💵 Cash on Delivery',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 text-foreground">
      <div className="container max-w-2xl">
        {/* Success Banner */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center mb-6 shadow-lg">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="font-display text-3xl font-black mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-5">
            Thank you for your purchase. Your order has been placed successfully.
          </p>

          <div className="inline-block rounded-full border border-[rgba(160,106,75,0.45)] bg-[rgba(160,106,75,0.10)] px-4 py-2">
            <p className="text-sm text-foreground font-semibold">
              Order ID:{' '}
              <span className="font-black text-primary">
                {orderId ? `${orderId.substring(0, 12)}...` : '—'}
              </span>
            </p>
          </div>
        </div>

        {/* Order Details */}
        {order && (
          <div className="rounded-2xl border border-border bg-card p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/60x60'}
                    alt={item.title}
                    className="w-14 h-14 object-cover rounded-xl border border-border"
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

            {/* Summary */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm gap-4">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground text-right">
                  {formatDate(order.createdAt)}
                </span>
              </div>

              <div className="flex justify-between text-sm gap-4">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium text-foreground text-right">
                  {paymentLabels[order.paymentMethod] || order.paymentMethod || '—'}
                </span>
              </div>

              <div className="flex justify-between text-sm gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold
                                 border border-[rgba(190,255,210,0.35)]
                                 bg-[rgba(190,255,210,0.12)]
                                 text-[rgba(210,255,230,0.95)]">
                  ✅ {(order.status || 'unknown').toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between font-bold text-lg pt-3 mt-2 border-t border-border">
                <span>Total Paid</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/"
            className="rounded-full border border-border bg-card text-foreground text-center py-3
                       hover:bg-[rgba(255,255,255,0.04)] transition font-semibold"
          >
            Back to Home
          </Link>

          <Link
            href="/artworks"
            className="rounded-full bg-primary text-primary-foreground text-center py-3
                       hover:brightness-110 transition font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}