'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-background py-12 text-foreground">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black mb-2">Your Cart</h1>
          <p className="text-muted-foreground">
            {cart.length === 0
              ? 'Your cart is empty'
              : `${cart.length} ${cart.length === 1 ? 'item' : 'items'} in your cart`}
          </p>
        </div>

        {/* Empty Cart */}
        {cart.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-lg">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">
              Explore our collection and add artworks you love!
            </p>
            <Link
              href="/artworks"
              className="inline-block rounded-full bg-primary px-8 py-3 text-primary-foreground
                         font-semibold text-base hover:brightness-110 transition"
            >
              Browse Artworks
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {cart.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden flex shadow-lg"
                >
                  {/* Artwork Image */}
                  <div className="w-28 sm:w-32 h-28 sm:h-32 flex-shrink-0">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/200x200?text=No+Image'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">by {item.artist}</p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        {item.style} · {item.medium}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="font-display text-xl font-black text-primary">
                        {formatPrice(item.price)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-sm font-medium transition flex items-center gap-1
                                   text-[rgba(255,170,170,0.95)] hover:text-[rgba(255,120,120,0.95)]"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear your cart?')) {
                    clearCart();
                  }
                }}
                className="text-sm font-medium transition
                           text-[rgba(255,170,170,0.95)] hover:text-[rgba(255,120,120,0.95)]"
              >
                Clear entire cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-border bg-card p-6 sticky top-6 shadow-lg">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                {/* Item List */}
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

                {/* Divider */}
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                </div>

                {/* Guest notice */}
                {!user && (
                  <div className="rounded-xl border border-[rgba(255,200,120,0.35)] bg-[rgba(255,200,120,0.12)] p-3 mb-4">
                    <p className="text-sm text-[rgba(255,235,205,0.95)]">
                      You&apos;ll need to log in to complete your purchase. Your cart will be saved!
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full rounded-full py-4 font-semibold text-base transition
                             bg-primary text-primary-foreground hover:brightness-110"
                >
                  {user ? 'Proceed to Checkout' : 'Log In to Checkout'}
                </button>

                {/* Continue Shopping */}
                <Link
                  href="/artworks"
                  className="block text-center font-medium mt-4 transition
                             text-primary hover:opacity-80"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}