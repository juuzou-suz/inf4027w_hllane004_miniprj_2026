'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, upsertUser } from '@/lib/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Prevents UI flicker on first load

  useEffect(() => {
  
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // No active session — clear the user and stop loading
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Attempt to fetch the user's extended profile from Firestore
        let userData = null;
        try {
          userData = await getUserById(firebaseUser.uid);
        } catch (err) {
          console.error('Error fetching user data:', err);
        }

        // First-time sign-in: no Firestore document exists yet.
        // Create a baseline profile so every user always has a complete record.
        if (!userData) {
          const baseline = {
            email: firebaseUser.email || '',
            role: 'customer',           // Default role for all new users
            name: firebaseUser.displayName || '',
            address: {
              street: '',
              city: '',
              postalCode: '',
            },
            createdAt: new Date(),
          };

          try {
            await upsertUser(firebaseUser.uid, baseline);
            userData = await getUserById(firebaseUser.uid);
          } catch (err) {
            console.error('Error creating baseline user doc:', err);
          }
        }

        const enrichedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData?.email || '',
          displayName: firebaseUser.displayName || userData?.name || '',
          role: userData?.role || 'customer',
          name: userData?.name || firebaseUser.displayName || '',
          address: userData?.address || { street: '', city: '', postalCode: '' },
          ...userData,
        };

        setUser(enrichedUser);

      } catch (error) {
        console.error('AuthContext error:', error);

        if (auth.currentUser) {
          setUser({
            uid: auth.currentUser.uid,
            email: auth.currentUser.email || '',
            displayName: auth.currentUser.displayName || '',
            role: 'customer',
            name: auth.currentUser.displayName || '',
            address: { street: '', city: '', postalCode: '' },
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    // Clean up the Firebase listener when the AuthProvider unmounts
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);

      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    logout,

    // refreshUser re-fetches the Firestore profile and merges it into the current user state.
    refreshUser: async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      try {
        const userData = await getUserById(firebaseUser.uid);

        // Merge fresh Firestore data over the existing state, preserving any fields that Firestore doesn't store (e.g. uid from Firebase Auth)
        setUser((prev) => ({
          ...(prev || {}),
          ...userData,
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData?.email || '',
          displayName: firebaseUser.displayName || userData?.name || '',
          role: userData?.role || prev?.role || 'customer',
          name: userData?.name || firebaseUser.displayName || prev?.name || '',
          address: userData?.address || prev?.address || { street: '', city: '', postalCode: '' },
        }));
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — enforces that useAuth is only called inside an AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthContext };