'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'customer',
        createdAt: new Date().toISOString(),
      });

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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'rgb(255, 255, 255)' }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-card)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              Join Curate
            </h1>

            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Create an account to start collecting and bidding.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-sm"
              style={{
                background: 'rgba(190, 58, 38, 0.08)',
                borderColor: 'rgba(190, 58, 38, 0.22)',
                color: '#8b2d1f',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
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
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  background: '#ffffff',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
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
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  background: '#ffffff',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Confirm */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
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
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  background: '#ffffff',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                background: 'var(--clay)',
                color: '#F5EFE6',
              }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link
              href={`/login${redirectUrl !== '/' ? `?redirect=${redirectUrl}` : ''}`}
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--clay)' }}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}