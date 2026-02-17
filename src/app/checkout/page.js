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
  {
    id: 'credit_card',
    label: 'Credit / Debit Card',
    icon: '💳',
    description: 'Visa, Mastercard, Amex',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    icon: '🅿️',
    description: 'Pay with your PayPal account',
  },
  {
    id: 'eft',
    label: 'EFT / Bank Transfer',
    icon: '🏦',
    description: 'Direct bank transfer',
  },
  {
    id: 'cash_on_delivery',
    label: 'Cash on Delivery',
    icon: '💵',
    description: 'Pay when you receive',
  },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const router = useRouter();

  const [selectedPayment, setSelectedPayment] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !placing) {
      router.push('/artworks');
    }
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
      // Build order items from cart
      const items = cart.map((item) => ({
        artworkId: item.id,
        title: item.title,
        artist: item.artist,
        imageUrl: item.imageUrl || '',
        price: item.price,
      }));

      // Create order in Firestore
      const orderId = await createOrder({
        userId: user.uid,
        userEmail: user.email,
        items,
        total: getCartTotal(),
        paymentMethod: selectedPayment,
        status: 'completed',
        itemCount: cart.length,
      });

      // Mark each artwork as sold
      await Promise.all(
        cart.map((item) =>
          updateDoc(doc(db, 'artworks', item.id), { status: 'sold' })
        )
      );

      // Clear cart
      clearCart();

      // Redirect to confirmation
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Your Items ({cart.length})
              </h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/80x80'}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
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
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Select Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      selectedPayment === method.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{method.icon}</div>
                    <div className="font-semibold text-gray-900">
                      {method.label}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {method.description}
                    </div>
                    {selectedPayment === method.id && (
                      <div className="mt-2 text-purple-600 text-sm font-medium">
                        ✓ Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Simulation Notice */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 Payment is simulated — no real transaction will occur. Simply select a method and place your order.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.title}
                    </span>
                    <span className="font-medium text-gray-900 flex-shrink-0">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-purple-600">{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              {/* Selected Payment Badge */}
              {selectedPayment && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-purple-700 font-medium">
                    {PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.icon}{' '}
                    {PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedPayment}
                className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>

              <Link
                href="/cart"
                className="block text-center text-purple-600 hover:text-purple-800 font-medium mt-4 transition"
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