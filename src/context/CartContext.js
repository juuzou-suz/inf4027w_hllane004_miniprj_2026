'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ✅ FIX 1: Listen to auth state changes.
  // On login  → load that user's saved cart from localStorage.
  // On logout → wipe cart from memory so it shows empty immediately.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        setCurrentUserId(uid);
        try {
          const saved = localStorage.getItem(`cart_${uid}`);
          setCart(saved ? JSON.parse(saved) : []);
        } catch {
          setCart([]);
        }
      } else {
        // Logged out — clear memory only, storage is kept for next login
        setCurrentUserId(null);
        setCart([]);
      }
      setCartLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  // Persist cart to localStorage, keyed per user so carts never bleed across accounts
  useEffect(() => {
    if (!cartLoaded || !currentUserId) return;
    try {
      localStorage.setItem(`cart_${currentUserId}`, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cart, cartLoaded, currentUserId]);

  const addToCart = (artwork) => {
    setCart((prev) => {
      if (prev.find((item) => item.id === artwork.id)) {
        alert('This artwork is already in your cart');
        return prev;
      }
      if (artwork.status !== 'available') {
        alert('This artwork is no longer available');
        return prev;
      }
      return [...prev, { ...artwork, quantity: 1 }];
    });
  };

  const removeFromCart = (artworkId) =>
    setCart((prev) => prev.filter((item) => item.id !== artworkId));

  const clearCart = () => setCart([]);

  const getCartTotal = () =>
    cart.reduce((total, item) => total + (item.price || 0), 0);

  const getCartCount = () => cart.length;

  return (
    <CartContext.Provider
      value={{ cart, cartLoaded, addToCart, removeFromCart, clearCart, getCartTotal, getCartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within CartProvider');
  return context;
}