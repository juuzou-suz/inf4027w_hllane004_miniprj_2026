'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  const addToCart = (artwork) => {
    setCart(prevCart => {
      // Check if item already in cart
      const existingItem = prevCart.find(item => item.id === artwork.id);
      
      if (existingItem) {
        // Item already in cart - just return existing cart
        alert('This artwork is already in your cart');
        return prevCart;
      }
      
      // Add new item (artworks are unique, quantity is always 1)
      return [...prevCart, { ...artwork, quantity: 1 }];
    });
  };

  // Remove item from cart
  const removeFromCart = (artworkId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== artworkId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Get cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price || 0), 0);
  };

  // Get cart item count
  const getCartCount = () => {
    return cart.length;
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}