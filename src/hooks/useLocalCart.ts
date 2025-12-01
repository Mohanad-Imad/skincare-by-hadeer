import { useState, useEffect } from "react";

export interface LocalCartItem {
  variantId: string;
  quantity: number;
}

const LOCAL_CART_KEY = "temp_cart";
const CART_UPDATE_EVENT = "local-cart-updated";

// إطلاق حدث مخصص عند تحديث السلة
const dispatchCartUpdate = () => {
  window.dispatchEvent(new Event(CART_UPDATE_EVENT));
};

export const useLocalCart = () => {
  const [localCart, setLocalCart] = useState<LocalCartItem[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // تحميل السلة من localStorage
    const loadCart = () => {
      const stored = localStorage.getItem(LOCAL_CART_KEY);
      if (stored) {
        try {
          setLocalCart(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem(LOCAL_CART_KEY);
        }
      }
    };

    loadCart();

    // الاستماع لتحديثات السلة من مكونات أخرى
    const handleCartUpdate = () => {
      loadCart();
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener(CART_UPDATE_EVENT, handleCartUpdate);
    return () => window.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate);
  }, []);

  const addToLocalCart = (variantId: string, quantity: number = 1) => {
    const existing = localCart.find((item) => item.variantId === variantId);
    let newCart: LocalCartItem[];
    
    if (existing) {
      newCart = localCart.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...localCart, { variantId, quantity }];
    }
    
    setLocalCart(newCart);
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newCart));
    dispatchCartUpdate();
  };

  const updateLocalCartQuantity = (variantId: string, quantity: number) => {
    const newCart = localCart.map((item) =>
      item.variantId === variantId ? { ...item, quantity } : item
    );
    setLocalCart(newCart);
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newCart));
    dispatchCartUpdate();
  };

  const removeFromLocalCart = (variantId: string) => {
    const newCart = localCart.filter((item) => item.variantId !== variantId);
    setLocalCart(newCart);
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newCart));
    dispatchCartUpdate();
  };

  const clearLocalCart = () => {
    setLocalCart([]);
    localStorage.removeItem(LOCAL_CART_KEY);
    dispatchCartUpdate();
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
