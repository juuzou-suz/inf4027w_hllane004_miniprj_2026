"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { updateUser } from "@/lib/firestore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get("redirect") || "/";
  const wishId = searchParams.get("wish"); // artworkId passed from ArtworkCard

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const uid = userCredential.user.uid;

      // Fetch user role + existing wishlist
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      const isAdmin = userData?.role === "admin";

      // If a wishlist intent exists AND user is not admin, add it (idempotent).
      if (!isAdmin && wishId) {
        const current = Array.isArray(userData?.wishlist) ? userData.wishlist : [];

        const ids = current
          .map((x) => (typeof x === "string" ? x : x?.id || x?.artworkId))
          .filter(Boolean);

        if (!ids.includes(wishId)) {
          await updateUser(uid, { wishlist: [...ids, wishId] });
        }
      }

      router.push(isAdmin ? "/admin" : redirectUrl);
    } catch (err) {
      console.error("Sign-in error:", err);

      const code = err?.code;
      if (code === "auth/invalid-credential") setError("Incorrect email or password.");
      else if (code === "auth/user-not-found") setError("No account found for this email address.");
      else if (code === "auth/wrong-password") setError("Incorrect password.");
      else if (code === "auth/invalid-email") setError("Enter a valid email address.");
      else if (code === "auth/too-many-requests") setError("Too many attempts. Please try again later.");
      else setError("We couldn’t sign you in. Please try again.");

      setLoading(false);
    }
  };

  // Preserve redirect AND wish when sending the user to register
  const registerHref = (() => {
    const params = new URLSearchParams();
    if (redirectUrl && redirectUrl !== "/") params.set("redirect", redirectUrl);
    if (wishId) params.set("wish", wishId);
    const qs = params.toString();
    return `/register${qs ? `?${qs}` : ""}`;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-black">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue collecting and bidding.
            </p>
          </div>

          {error && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-sm
                         border-[rgba(255,120,120,0.35)]
                         bg-[rgba(190,58,38,0.18)]
                         text-[rgba(255,225,225,0.95)]"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none
                           bg-[rgba(255,255,255,0.04)]
                           placeholder:text-muted-foreground/70
                           focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]
                           focus:border-[rgba(160,106,75,0.9)]
                           disabled:opacity-70"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Enter your password"
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none
                           bg-[rgba(255,255,255,0.04)]
                           placeholder:text-muted-foreground/70
                           focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]
                           focus:border-[rgba(160,106,75,0.9)]
                           disabled:opacity-70"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all
                         bg-primary text-primary-foreground
                         hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href={registerHref} className="font-semibold text-primary hover:opacity-80">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}