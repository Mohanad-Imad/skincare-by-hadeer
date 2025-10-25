import { useState, useEffect } from "react";

export interface LocalCartItem {
  variantId: string;
  quantity: number;
}

const LOCAL_CART_KEY = "temp_cart";

export const useLocalCart = () => {
  const [localCart, setLocalCart] = useState<LocalCartItem[]>([]);

  useEffect(() => {
    // تحميل السلة من localStorage
    const stored = localStorage.getItem(LOCAL_CART_KEY);
    if (stored) {
      try {
        setLocalCart(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(LOCAL_CART_KEY);
      }
    }
  }, []);

  const addToLocalCart = (variantId: string) => {
    const existing = localCart.find((item) => item.variantId === variantId);
    let newCart: LocalCartItem[];
    
    if (existing) {
      newCart = localCart.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...localCart, { variantId, quantity: 1 }];
    }
    
    setLocalCart(newCart);
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newCart));
  };

  const updateLocalCartQuantity = (variantId: string, quantity: number) => {
    const newCart = localCart.map((item) =>
      item.variantId === variantId ? { ...item, quantity } : item
    );
    setLocalCart(newCart);
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newCart));
  };

  const removeFromLocalCart = (variantId: string) => {
    const newCart = localCart.filter((item) => item.variantId !== variantId);
    setLocalCart(newCart);
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newCart));
  };

  const clearLocalCart = () => {
    setLocalCart([]);
    localStorage.removeItem(LOCAL_CART_KEY);
  };

  const getLocalCartCount = () => {
    return localCart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return {
    localCart,
    addToLocalCart,
    updateLocalCartQuantity,
    removeFromLocalCart,
    clearLocalCart,
    getLocalCartCount,
  };
};
