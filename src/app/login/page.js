'use client'; // This runs in the browser

// Import React hooks
import { useState } from 'react';


// Import Next.js navigation
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import Firebase authentication function
import { signInWithEmailAndPassword } from 'firebase/auth';

// Import our Firebase auth instance
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  // useRouter allows us to redirect users after successful login
  const router = useRouter();

  // Form state - stores what user types in the form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state - controls loading and error messages
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page from refreshing when form is submitted
    
    // Clear any previous errors
    setError('');

    // Show loading state
    setLoading(true);

    try {
      // Firebase's built-in login function
      // This checks if email and password are correct
      await signInWithEmailAndPassword(auth, email, password);

      // Success! Redirect to homepage
      // The AuthContext will automatically detect the user is logged in
      router.push('/');

    } catch (error) {
      // Handle errors
      console.error('Login error:', error);

      // Show user-friendly error messages
      if (error.code === 'auth/invalid-credential') {
        // This covers both wrong email and wrong password
        setError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }

      setLoading(false); // Stop loading state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎨 Welcome Back
          </h1>
          <p className="text-gray-600">
            Log in to continue bidding on artworks
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-gray-600 mt-6">
          Do not have an account?{' '}
          <Link 
            href="/register" 
            className="text-blue-600 font-semibold hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}