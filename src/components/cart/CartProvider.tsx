'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the type for a cart item
export interface CartItem {
  id: string;
  shoeId: string; // Sequential ID from inventory (001, 002, etc.)
  name: string;
  brand: string;
  sport: string;
  gender: string;
  size: string;
  color: string;
  condition: string;
  image: string;
}

// Define the type for the cart context
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => boolean; // Returns true if added, false if limit reached
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  itemCount: number;
  canAddMore: boolean; // New property to check if more items can be added
  maxItems: number; // New property for the maximum allowed items
}

// Maximum number of shoes allowed in a single request
const MAX_ITEMS_PER_REQUEST = 2;

// Create the context with a default value
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => false,
  removeItem: () => {},
  clearCart: () => {},
  isInCart: () => false,
  itemCount: 0,
  canAddMore: true,
  maxItems: MAX_ITEMS_PER_REQUEST,
});

// Hook for easy access to the cart context
export const useCart = () => useContext(CartContext);

// The provider component that will wrap the app
export function CartProvider({ children }: { children: React.ReactNode }) {
  // Use local storage to persist cart between sessions
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on initial render (client-side only)
  useEffect(() => {
    setMounted(true);
    const storedCart = localStorage.getItem('shoeCart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        // Ensure we don't load more than the maximum allowed items
        setItems(parsedCart.slice(0, MAX_ITEMS_PER_REQUEST));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('shoeCart');
      }
    }
  }, []);

  // Update localStorage when cart changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('shoeCart', JSON.stringify(items));
    }
  }, [items, mounted]);

  // Add an item to the cart
  const addItem = (item: CartItem): boolean => {
    // Check if we've reached the maximum number of items
    if (items.length >= MAX_ITEMS_PER_REQUEST) {
      return false; // Cannot add more items
    }

    setItems((prevItems) => {
      // Check if the item is already in the cart
      if (prevItems.some((i) => i.id === item.id)) {
        return prevItems;
      }
      return [...prevItems, item];
    });
    
    return true; // Item was added successfully
  };

  // Remove an item from the cart
  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // Clear the entire cart
  const clearCart = () => {
    setItems([]);
  };

  // Check if an item is in the cart
  const isInCart = (id: string) => {
    return items.some((item) => item.id === id);
  };

  // Calculate the number of items in the cart
  const itemCount = items.length;

  // Check if more items can be added
  const canAddMore = itemCount < MAX_ITEMS_PER_REQUEST;

  // The value to be provided to consuming components
  const value = {
    items,
    addItem,
    removeItem,
    clearCart,
    isInCart,
    itemCount,
    canAddMore,
    maxItems: MAX_ITEMS_PER_REQUEST,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
} 