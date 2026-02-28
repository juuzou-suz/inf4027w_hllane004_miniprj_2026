"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/lib/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

const PAYMENT_METHODS = [
  { id: "credit_card", label: "💳 Credit / debit card", description: "Visa, Mastercard, Amex" },
  { id: "paypal", label: "🅿️ PayPal", description: "Pay using your PayPal account" },
  { id: "eft", label: "🏦 EFT / bank transfer", description: "Direct bank transfer" },
  { id: "cash_on_delivery", label: "💵 Cash on delivery", description: "Pay on delivery" },
];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, cartLoaded, clearCart, getCartTotal } = useCart();
  const router = useRouter();

  const [selectedPayment, setSelectedPayment] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !cartLoaded) return;
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    if (cart.length === 0 && !placing) {
      router.push("/artworks");
    }
  }, [authLoading, cartLoaded, user, cart, placing, router]);

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      setError("Select a payment method to continue.");
      return;
    }

    setError("");
    setPlacing(true);

    try {
      const items = cart.map((item) => ({
        artworkId: item.id,
        title: item.title,
        artist: item.artist,
        imageUrl: item.imageUrl || "",
        price: item.price,
      }));

      const orderId = await createOrder({
        userId: user.uid,
        userEmail: user.email,
        type: "standard",
        items,
        total: getCartTotal(),
        paymentMethod: selectedPayment,
        status: "completed",
        itemCount: cart.length,
      });

      await Promise.all(cart.map((item) => updateDoc(doc(db, "artworks", item.id), { status: "sold" })));

      clearCart();
      router.push(`/orderConfirmation?orderId=${orderId}`);
    } catch (err) {
      console.error("Error placing order:", err);
      setError("We couldn’t place your order. Please try again.");
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
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black">Checkout</h1>
          <p className="mt-1 text-muted-foreground">Review your items and choose a payment method.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">Items</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.imageUrl || "/Images/placeholder.png"}
                      alt={item.title || "Artwork"}
                      className="h-16 w-16 flex-shrink-0 rounded-xl border border-border object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/Images/placeholder.png";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.artist ? `by ${item.artist}` : "—"}</p>
                      {item.medium && <p className="mt-0.5 text-xs text-muted-foreground/70">{item.medium}</p>}
                    </div>
                    <span className="flex-shrink-0 font-display text-lg font-black text-primary">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end border-t border-border pt-4">
                <Link href="/cart" className="text-sm font-medium text-primary transition hover:opacity-80">
                  Edit cart
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="mb-6 text-xl font-bold">Payment method</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => {
                  const active = selectedPayment === method.id;

                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      type="button"
                      className={[
                        "rounded-2xl border p-4 text-left transition hover:bg-[rgba(255,255,255,0.04)]",
                        active ? "bg-[rgba(160,106,75,0.10)]" : "bg-transparent",
                      ].join(" ")}
                      style={{
                        borderColor: active ? "rgba(160,106,75,0.70)" : "var(--border)",
                      }}
                    >
                      <div className="font-semibold text-foreground">{method.label}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{method.description}</div>
                      {active && <div className="mt-2 text-sm font-semibold text-primary">Selected</div>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-[rgba(255,255,255,0.04)] p-3">
                <p className="text-sm text-muted-foreground">
                  Select a method and place the order to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="mb-6 text-xl font-bold">Summary</h2>

              <div className="mb-6 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="flex-1 truncate text-muted-foreground">{item.title}</span>
                    <span className="flex-shrink-0 font-medium text-foreground">{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-6 space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-foreground">Free</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {selectedMethod && (
                <div className="mb-4 rounded-xl border border-border bg-[rgba(255,255,255,0.04)] p-3">
                  <p className="text-sm font-semibold text-foreground">{selectedMethod.label}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.18)] px-3 py-2 text-sm text-[rgba(255,225,225,0.95)]">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedPayment}
                className="w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {placing ? "Placing order…" : "Place order"}
              </button>

              <Link href="/cart" className="mt-4 block text-center text-sm font-medium text-primary transition hover:opacity-80">
                Back to cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}