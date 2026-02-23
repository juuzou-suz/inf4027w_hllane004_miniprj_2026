'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter your full name');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      // Keep Firebase Auth displayName in sync (optional, but useful)
      await updateProfile(user, { displayName: trimmedName });

      // Create user profile in Firestore (merge-safe schema)
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: trimmedName,
          email: user.email,
          role: 'customer',
          createdAt: serverTimestamp(),
          address: {
            street: '',
            city: '',
            postalCode: '',
          },
        },
        { merge: true }
      );

      router.push(redirectUrl);
    } catch (err) {
      console.error('Registration error:', err);

      const code = err?.code;
      if (code === 'auth/email-already-in-use') setError('This email is already registered. Please log in instead.');
      else if (code === 'auth/invalid-email') setError('Invalid email address.');
      else if (code === 'auth/weak-password') setError('Password is too weak. Use at least 6 characters.');
      else setError('Registration failed. Please try again.');

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-black">Join Curate.</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create an account to start collecting and bidding.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-sm
                         border-[rgba(255,120,120,0.35)]
                         bg-[rgba(190,58,38,0.18)]
                         text-[rgba(255,225,225,0.95)]"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="e.g., Lisa Hlaks"
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none
                           bg-[rgba(255,255,255,0.04)]
                           placeholder:text-muted-foreground/70
                           focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]
                           focus:border-[rgba(160,106,75,0.9)]
                           disabled:opacity-70"
              />
            </div>

            {/* Email */}
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
              />
            </div>

            {/* Password */}
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
                placeholder="At least 6 characters"
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none
                           bg-[rgba(255,255,255,0.04)]
                           placeholder:text-muted-foreground/70
                           focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]
                           focus:border-[rgba(160,106,75,0.9)]
                           disabled:opacity-70"
              />
            </div>

            {/* Confirm */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Re-enter your password"
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none
                           bg-[rgba(255,255,255,0.04)]
                           placeholder:text-muted-foreground/70
                           focus:ring-2 focus:ring-[rgba(160,106,75,0.35)]
                           focus:border-[rgba(160,106,75,0.9)]
                           disabled:opacity-70"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all
                         bg-primary text-primary-foreground
                         hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={`/login${redirectUrl !== '/' ? `?redirect=${redirectUrl}` : ''}`}
              className="font-semibold text-primary hover:opacity-80"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}