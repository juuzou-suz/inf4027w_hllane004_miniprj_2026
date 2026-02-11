'use client'; // This tells Next.js this component runs in the browser, not on the server

// Import React hooks we need
// useState = stores data that can change (like current user)
// useContext = lets components access Context data
// useEffect = runs code when component loads or data changes
// createContext = creates the Context itself
import { createContext, useContext, useEffect, useState } from 'react';

// Import Firebase authentication functions
import { 
  onAuthStateChanged,  // Listens for login/logout events
  signOut,             // Logs user out
} from 'firebase/auth';

// Import our Firebase auth instance
import { auth } from '@/lib/firebase';
import { getUserById } from '@/lib/firestore';

// Create the Context
// This is like creating an empty "storage box" that will hold our auth data
const AuthContext = createContext({});

// AuthProvider Component
// This wraps our entire app and provides authentication data to all child components
export function AuthProvider({ children }) {
  // State to store the current user
  // null = no user logged in
  // object = user is logged in (contains user info)
  const [user, setUser] = useState(null);
  
  // State to track if we're still checking if user is logged in
  // true = still checking, false = done checking
  const [loading, setLoading] = useState(true);

  // useEffect runs when component first loads
  useEffect(() => {
    // onAuthStateChanged listens for login/logout events
    // Firebase automatically calls this function whenever auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
       // Fetch user data from Firestore to get role
        try {
          const userData = await getUserById(firebaseUser.uid);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: userData?.role || 'customer', // Get role from Firestore
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback if Firestore fetch fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'customer',
          });
        }
      } else {
        setUser(null);
      }
      
      // Done checking authentication state
      setLoading(false);
    });

    // Cleanup function - stops listening when component unmounts
    // This prevents memory leaks
    return () => unsubscribe();
  }, []); // Empty array = only run once when component loads

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth); // Tell Firebase to sign out
      setUser(null);       // Clear user from state
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // This is the data we're sharing with the entire app
  const value = {
    user,      // Current user object (or null if not logged in)
    loading,   // Is authentication still loading?
    logout,    // Function to log out
  };

  // Provide the auth data to all child components
  // {children} = all the pages/components in our app
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
  
  // Note: {!loading && children} means:
  // "Only show the app content when we're done checking if user is logged in"
  // This prevents a flash of wrong content (e.g., showing login page when user is actually logged in)
}

// Custom hook to use auth context
// This is a shortcut so components can easily access auth data
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Export the context itself (in case we need it elsewhere)
export { AuthContext };