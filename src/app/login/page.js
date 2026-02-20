'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Fetch user role from Firestore to determine redirect
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirectUrl);
      }
    } catch (err) {
      console.error('Login error:', err);

      const code = err?.code;
      if (code === 'auth/invalid-credential') setError('Invalid email or password. Please try again.');
      else if (code === 'auth/user-not-found') setError('No account found with this email. Please register first.');
      else if (code === 'auth/wrong-password') setError('Incorrect password. Please try again.');
      else if (code === 'auth/invalid-email') setError('Invalid email address format.');
      else if (code === 'auth/too-many-requests') setError('Too many failed login attempts. Please try again later.');
      else setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background:  'rgb(255, 255, 255)' }}
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
            <h1
              className="font-display text-3xl font-black"
              style={{ color: 'var(--text-primary)' }}
            >
              Welcome back
            </h1>

            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Log in to continue collecting and bidding.
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
          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="Enter your password"
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
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link
              href={`/register${redirectUrl !== '/' ? `?redirect=${redirectUrl}` : ''}`}
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--clay)' }}
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}