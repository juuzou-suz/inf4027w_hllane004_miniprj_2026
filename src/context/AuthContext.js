'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, upsertUser } from '@/lib/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // enriched app user (auth + firestore)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // 1) Get Firestore user profile (may be missing for older accounts)
        let userData = null;
        try {
          userData = await getUserById(firebaseUser.uid);
        } catch (err) {
          console.error('Error fetching user data:', err);
        }

        // 2) If missing, create/merge a baseline document so future reads always work
        if (!userData) {
          const baseline = {
            email: firebaseUser.email || '',
            role: 'customer',
            name: firebaseUser.displayName || '',
            // optional profile fields (safe defaults)
            address: {
              street: '',
              city: '',
              postalCode: '',
            },
            createdAt: new Date(), // ok for baseline; server-side timestamps should be set in registration ideally
          };

          try {
            await upsertUser(firebaseUser.uid, baseline);
            userData = await getUserById(firebaseUser.uid);
          } catch (err) {
            console.error('Error creating baseline user doc:', err);
          }
        }

        // 3) Build the enriched user object used across the app
        const enrichedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData?.email || '',
          displayName: firebaseUser.displayName || userData?.name || '',
          role: userData?.role || 'customer',

          // Firestore profile fields you’ll actually use
          name: userData?.name || firebaseUser.displayName || '',
          address: userData?.address || { street: '', city: '', postalCode: '' },

          // include anything else you store on the user doc
          ...userData,
        };

        setUser(enrichedUser);
      } catch (error) {
        console.error('AuthContext error:', error);

        // fallback: still allow app to run
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

    // Optional helper: refresh user profile after saving profile edits
    refreshUser: async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      try {
        const userData = await getUserById(firebaseUser.uid);
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthContext };