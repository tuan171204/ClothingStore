"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // 1. Load giỏ hàng từ LocalStorage khi web vừa mở
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Lỗi đọc LocalStorage:", error);
      }
    }
  }, []);

  // 2. Lưu giỏ hàng vào LocalStorage mỗi khi cartItems thay đổi
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // 3. Hàm thêm vào giỏ
  const addToCart = (product, sku, quantity = 1) => {
    setCartItems((prevItems) => {
      const currentSkuId = sku.skuId || sku.id;

      const existingItemIndex = prevItems.findIndex(
        (item) => item.skuId === currentSkuId
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        const updatedItem = { ...newItems[existingItemIndex] };
        const newQuantity = updatedItem.quantity + quantity;

        if (newQuantity > sku.stockQuantity) {
          alert(`Chỉ còn ${sku.stockQuantity} sản phẩm trong kho!`);
          return prevItems;
        }

        updatedItem.quantity = newQuantity;
        newItems[existingItemIndex] = updatedItem;
        return newItems;
      } else {
        const optionSummary = sku.options
          ? Object.values(sku.options).join(' - ')
          : '';

        const newItem = {
          skuId: currentSkuId,
          productId: product.id,
          name: product.name,
          thumbnail: product.thumbnail,
          price: sku.price,
          variantName: optionSummary,
          stock: sku.stockQuantity,
          quantity: quantity,
        };
        return [...prevItems, newItem];
      }
    });
  };

  // 4. Hàm xóa sản phẩm
  const removeFromCart = (skuId) => {
    setCartItems((prev) => prev.filter((item) => item.skuId !== skuId));
  };

  // 5. Hàm cập nhật số lượng (+/-)
  const updateQuantity = (skuId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.skuId === skuId) {
          // Validate tồn kho và số lượng tối thiểu
          if (newQuantity < 1) return item;
          if (newQuantity > item.stock) {
            alert(`Rất tiếc, kho chỉ còn ${item.stock} sản phẩm.`);
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Xóa giỏ hàng sau khi thanh toán thành công
  const clearCart = () => {
    setCartItems([]); // Xóa sạch state
    localStorage.removeItem("cartItems"); // Xóa luôn trong storage cho chắc
  };

  // 6. Tính tổng tiền tạm tính
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);