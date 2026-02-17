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
    if (orderId) {
      fetchOrder();
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Banner */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center mb-6">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          <div className="bg-purple-50 rounded-lg px-4 py-2 inline-block">
            <p className="text-sm text-purple-700 font-medium">
              Order ID: <span className="font-bold">{orderId?.substring(0, 12)}...</span>
            </p>
          </div>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Order Details
            </h2>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/60x60'}
                    alt={item.title}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">by {item.artist}</p>
                  </div>
                  <p className="font-bold text-purple-600">
                    {formatPrice(item.price)}
                  </p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">
                  {paymentLabels[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                  ✅ {order.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total Paid</span>
                <span className="text-purple-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/"
            className="bg-white text-purple-600 border-2 border-purple-600 text-center py-3 rounded-lg hover:bg-purple-50 transition font-semibold"
          >
            Back to Home
          </Link>
          <Link
            href="/artworks"
            className="bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}