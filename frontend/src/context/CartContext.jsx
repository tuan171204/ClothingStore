"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cartService } from "@/services/cartService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { checkoutService } from "@/services/checkoutService";

const CartContext = createContext();
const GUEST_SESSION_KEY = "guest_session_id";

// Tạo/lấy guest session ID
const getOrCreateSessionId = () => {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const syncFromResponse = (cartResponse) => {
    if (!cartResponse) return;
    setCartItems(cartResponse.items || []);
    setCartTotal(cartResponse.totalAmount || 0);
    setCartCount(cartResponse.totalItems || 0);

    // Hiển thị warning nếu stock thay đổi
    cartResponse.items?.forEach(item => {
      if (item.stockWarning) {
        toast.warn(`⚠️ ${item.productName}: ${item.warningMessage}`);
      }
    });
  };

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const data = await cartService.getCart();
        syncFromResponse(data);
      } else {
        const sessionId = getOrCreateSessionId();
        if (sessionId) {
          const data = await cartService.getGuestCart(sessionId);
          syncFromResponse(data);
        }
      }
    } catch (err) {
      console.error("Lỗi load cart:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load cart khi user state thay đổi
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Merge guest cart khi user vừa login
  useEffect(() => {
    if (!user) return;
    const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (sessionId) {
      cartService.mergeCart(sessionId)
        .then(merged => {
          syncFromResponse(merged);
          localStorage.removeItem(GUEST_SESSION_KEY);
        })
        .catch(() => fetchCart());
    }
  }, [user]);

  const addToCart = async (product, sku, quantity = 1) => {
    try {
      const skuId = sku.skuId || sku.id;
      let data;
      if (user) {
        data = await cartService.addItem(skuId, quantity);
      } else {
        const sessionId = getOrCreateSessionId();
        data = await cartService.addToGuestCart(sessionId, skuId, quantity);
      }
      syncFromResponse(data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi thêm vào giỏ";
      toast.error(msg);
      throw err;
    }
  };

  const removeFromCart = async (skuId) => {
    try {
      await cartService.removeItem(skuId);
      setCartItems(prev => prev.filter(i => i.skuId !== skuId));
      await fetchCart(); // Re-sync để cập nhật total
    } catch (err) {
      toast.error("Lỗi xóa sản phẩm");
    }
  };

  const updateQuantity = async (skuId, newQuantity) => {
    try {
      const data = await cartService.updateItem(skuId, newQuantity);
      syncFromResponse(data);
    } catch (err) {
      const msg = err?.response?.data?.message || "Lỗi cập nhật số lượng";
      toast.error(msg);
    }
  };

  const clearCart = async () => {
    try {
      if (user) await cartService.clearCart();
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
    } catch (err) {
      console.error("Lỗi clear cart:", err);
    }
  };

  const validateCart = useCallback(async () => {
    if (!user) return null;
    try {
      const validated = await checkoutService.validateCart();
      syncFromResponse(validated);
      return validated;
    } catch (err) {
      console.error("Lỗi validate cart:", err);
      return null;
    }
  }, [user]);


  return (
    <CartContext.Provider value={{
      cartItems, cartTotal, cartCount, loading,
      addToCart, removeFromCart, updateQuantity, clearCart, fetchCart, validateCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);