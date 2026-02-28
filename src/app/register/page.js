"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) { setError("Enter your full name."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Use at least 6 characters for your password."); return; }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: trimmedName });

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: trimmedName,
          email: user.email,
          role: "customer",
          createdAt: serverTimestamp(),
          address: { street: "", city: "", postalCode: "" },
        },
        { merge: true }
      );

      router.push(redirectUrl);
    } catch (err) {
      console.error("Registration error:", err);
      const code = err?.code;
      if (code === "auth/email-already-in-use") setError("This email address is already registered. Sign in instead.");
      else if (code === "auth/invalid-email") setError("Enter a valid email address.");
      else if (code === "auth/weak-password") setError("Password is too weak. Use at least 6 characters.");
      else setError("We couldn't create your account. Please try again.");
      setLoading(false);
    }
  };

  const loginHref = `/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-black">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Collect original works and place bids in real time.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border px-4 py-3 text-sm border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.18)] text-[rgba(255,225,225,0.95)]" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-5">
            {[
              { id: "name", label: "Full name", type: "text", value: name, onChange: setName, placeholder: "e.g., Lisa Hlaks", autoComplete: "name" },
              { id: "email", label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com", autoComplete: "email" },
              { id: "password", label: "Password", type: "password", value: password, onChange: setPassword, placeholder: "At least 6 characters", autoComplete: "new-password" },
              { id: "confirmPassword", label: "Confirm password", type: "password", value: confirmPassword, onChange: setConfirmPassword, placeholder: "Re-enter your password", autoComplete: "new-password" },
            ].map(({ id, label, type, value, onChange, placeholder, autoComplete }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  required
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={loading}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none bg-[rgba(255,255,255,0.04)] placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-[rgba(160,106,75,0.35)] focus:border-[rgba(160,106,75,0.9)] disabled:opacity-70"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={loginHref} className="font-semibold text-primary hover:opacity-80">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>}>
      <RegisterContent />
    </Suspense>
  );
}