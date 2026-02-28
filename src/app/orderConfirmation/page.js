"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/orderConfirmation");
      return;
    }
    if (orderId) fetchOrder();
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      const orderDoc = await getDoc(doc(db, "orders", orderId));
      if (orderDoc.exists()) setOrder({ id: orderDoc.id, ...orderDoc.data() });
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const paymentLabels = {
    credit_card: "Credit / debit card",
    paypal: "PayPal",
    eft: "EFT / bank transfer",
    cash_on_delivery: "Cash on delivery",
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
        <div className="mb-6 rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <h1 className="mb-2 font-display text-3xl font-black">Order confirmed</h1>
          <p className="mb-5 text-muted-foreground">
            Thank you. Your order has been placed successfully.
          </p>
          <div className="inline-block rounded-full border border-[rgba(160,106,75,0.45)] bg-[rgba(160,106,75,0.10)] px-4 py-2">
            <p className="text-sm font-semibold text-foreground">
              Order reference:{" "}
              <span className="font-black text-primary">
                {orderId ? orderId.slice(0, 12) : "—"}
              </span>
            </p>
          </div>
        </div>

        {order ? (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Order details</h2>
            <div className="mb-6 space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <img
                    src={item.imageUrl || "/Images/placeholder.png"}
                    alt={item.title || "Artwork"}
                    className="h-14 w-14 rounded-xl border border-border object-cover"
                    onError={(e) => { e.currentTarget.src = "/Images/placeholder.png"; }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.artist ? `by ${item.artist}` : "—"}</p>
                  </div>
                  <p className="font-display font-black text-primary">{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="text-right font-medium text-foreground">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Payment method</span>
                <span className="text-right font-medium text-foreground">
                  {paymentLabels[order.paymentMethod] || order.paymentMethod || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Status</span>
                <span
                  className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                  style={{ borderColor: "rgba(190,255,210,0.25)", background: "rgba(190,255,210,0.10)", color: "rgba(210,255,230,0.95)" }}
                >
                  {(order.status || "unknown").toUpperCase()}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-lg font-bold">
                <span>Total paid</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
            <p className="text-muted-foreground">We couldn't load the order details.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/" className="rounded-full border border-border bg-card py-3 text-center font-semibold text-foreground transition hover:bg-[rgba(255,255,255,0.04)]">
            Return home
          </Link>
          <Link href="/artworks" className="rounded-full bg-primary py-3 text-center font-semibold text-primary-foreground transition hover:brightness-110">
            View collection
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}