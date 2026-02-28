"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, removeFromCart, getCartTotal, clearCart, cartLoaded } = useCart();
  const router = useRouter();

  const [clearing, setClearing] = useState(false);

  useEffect(() => {
  if (!cartLoaded) return;
  if (cart.length === 0) router.push('/artworks');
}, [cartLoaded, cart, router]);

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const handleCheckout = () => {
  if (!user) { router.push('/login?redirect=/cart'); return; }
  router.push('/checkout');
};

  const handleClearCart = async () => {
    if (clearing) return;

    const ok = window.confirm("Remove all items from your cart?");
    if (!ok) return;

    setClearing(true);
    try {
      await clearCart();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 text-foreground">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-display text-4xl font-black">Cart</h1>
          <p className="text-muted-foreground">
            {cart.length === 0
              ? "Your cart is empty."
              : `${cart.length} ${cart.length === 1 ? "item" : "items"} in your cart`}
          </p>
        </div>

        {/* Empty state */}
        {cart.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-lg">
            <h2 className="mb-3 text-2xl font-bold">Nothing here yet</h2>
            <p className="mb-8 text-muted-foreground">
              Browse the collection and add works you would like to acquire.
            </p>
            <Link
              href="/artworks"
              className="inline-block rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition hover:brightness-110"
            >
              View collection
            </Link>
          </div>
        )}

        {/* Cart items */}
        {cart.length > 0 && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Items list */}
            <div className="space-y-4 lg:col-span-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
                >
                  <div className="h-28 w-28 flex-shrink-0 sm:h-32 sm:w-32">
                    <img
                      src={item.imageUrl || "/Images/placeholder.png"}
                      alt={item.title || "Artwork"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/Images/placeholder.png";
                      }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.artist ? `by ${item.artist}` : "—"}</p>
                      {(item.style || item.medium) && (
                        <p className="mt-1 text-sm text-muted-foreground/80">
                          {[item.style, item.medium].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display text-xl font-black text-primary">
                        {formatPrice(item.price)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="flex items-center gap-1 text-sm font-medium text-[rgba(255,170,170,0.95)] transition hover:text-[rgba(255,120,120,0.95)]"
                        aria-label={`Remove ${item.title} from cart`}
                        type="button"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <button
                onClick={handleClearCart}
                className="text-sm font-medium text-[rgba(255,170,170,0.95)] transition hover:text-[rgba(255,120,120,0.95)]"
                type="button"
                disabled={clearing}
              >
                Remove all items
              </button>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
                <h2 className="mb-6 text-xl font-bold">Order Summary</h2>

                <div className="mb-6 space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <span className="flex-1 truncate text-muted-foreground">{item.title}</span>
                      <span className="flex-shrink-0 font-medium text-foreground">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mb-6 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(getCartTotal())}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground transition hover:brightness-110"
                  type="button"
                >
                  Continue to checkout
                </button>

                <Link
                  href="/artworks"
                  className="mt-4 block text-center text-sm font-medium text-primary transition hover:opacity-80"
                >
                  Continue browsing
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}