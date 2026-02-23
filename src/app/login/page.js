'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { updateUser } from '@/lib/firestore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/';
  const wishId = searchParams.get('wish'); // artworkId passed from ArtworkCard

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
      const uid = userCredential.user.uid;

      // Fetch user role + existing wishlist
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      const isAdmin = userData?.role === 'admin';

      // If a wishlist intent exists AND user is not admin, add it (idempotent)
      if (!isAdmin && wishId) {
        const current = Array.isArray(userData?.wishlist) ? userData.wishlist : [];

        // Tolerate old formats (objects), normalize to ids
        const ids = current
          .map((x) => (typeof x === 'string' ? x : x?.id || x?.artworkId))
          .filter(Boolean);

        if (!ids.includes(wishId)) {
          const next = [...ids, wishId];
          await updateUser(uid, { wishlist: next });
        }
      }

      // Redirect
      if (isAdmin) {
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

  // Preserve redirect AND wish when sending the user to register
  const registerHref = (() => {
    const params = new URLSearchParams();
    if (redirectUrl && redirectUrl !== '/') params.set('redirect', redirectUrl);
    if (wishId) params.set('wish', wishId);
    const qs = params.toString();
    return `/register${qs ? `?${qs}` : ''}`;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-black">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Log in to continue collecting and bidding.
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
          <form onSubmit={handleLogin} className="space-y-5">
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
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all
                         bg-primary text-primary-foreground
                         hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={registerHref}
              className="font-semibold text-primary hover:opacity-80"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}