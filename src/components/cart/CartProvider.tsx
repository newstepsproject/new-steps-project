'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the type for a cart item
export interface CartItem {
  id: string;
  inventoryId: string;
  shoeId: number; // Sequential ID from inventory (101, 102, etc.)
  name: string;
  brand: string;
  modelName: string;
  size: string;
  color: string;
  sport: string;
  condition: string;
  gender: 'men' | 'women' | 'unisex' | 'boys' | 'girls';
  image: string;
  quantity: number;
  notes?: string;
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

// Default maximum number of shoes allowed in a single request
const DEFAULT_MAX_ITEMS_PER_REQUEST = 2;

// Create the context with a default value
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => false,
  removeItem: () => {},
  clearCart: () => {},
  isInCart: () => false,
  itemCount: 0,
  canAddMore: true,
  maxItems: DEFAULT_MAX_ITEMS_PER_REQUEST,
});

// Hook for easy access to the cart context
export const useCart = () => useContext(CartContext);

// The provider component that will wrap the app
export function CartProvider({ children }: { children: React.ReactNode }) {
  // Use local storage to persist cart between sessions
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [maxItems, setMaxItems] = useState(DEFAULT_MAX_ITEMS_PER_REQUEST);

  // Load cart from localStorage and max items setting on initial render (client-side only)
  useEffect(() => {
    setMounted(true);
    
    // Load max items from settings via API
    fetch('/api/settings')
      .then(response => response.json())
      .then(settings => {
        setMaxItems(settings.maxShoesPerRequest);
      })
      .catch(error => {
        console.error('Error loading max items setting:', error);
        setMaxItems(DEFAULT_MAX_ITEMS_PER_REQUEST);
      });
    
    const storedCart = localStorage.getItem('shoeCart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        // Ensure we don't load more than the maximum allowed items
        setItems(parsedCart.slice(0, DEFAULT_MAX_ITEMS_PER_REQUEST));
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
    if (items.length >= maxItems) {
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
  const canAddMore = itemCount < maxItems;

  // The value to be provided to consuming components
  const value = {
    items,
    addItem,
    removeItem,
    clearCart,
    isInCart,
    itemCount,
    canAddMore,
    maxItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
} 