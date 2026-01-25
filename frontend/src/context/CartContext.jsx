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
      // Kiểm tra xem SKU này đã có trong giỏ chưa
      const existingItemIndex = prevItems.findIndex(
        (item) => item.skuId === sku.id
      );

      if (existingItemIndex > -1) {
        // Nếu có rồi -> Tăng số lượng
        const newItems = [...prevItems];
        const currentItem = newItems[existingItemIndex];
        const newQuantity = currentItem.quantity + quantity;

        // Kiểm tra tồn kho
        if (newQuantity > sku.stockQuantity) {
          alert(`Chỉ còn ${sku.stockQuantity} sản phẩm trong kho!`);
          return prevItems; // Không thay đổi gì
        }

        newItems[existingItemIndex].quantity = newQuantity;
        return newItems;
      } else {
        // Nếu chưa có -> Thêm mới
        // Lưu ý: Chỉ lưu những thông tin cần thiết để hiển thị
        const newItem = {
          skuId: sku.id,
          productId: product.id,
          name: product.name,
          thumbnail: product.thumbnail, // Link ảnh từ JSON
          price: sku.price,             // Giá của SKU (không phải giá gốc SP)
          variantName: sku.skuName,     // VD: "Đỏ - M"
          stock: sku.stockQuantity,     // Để validate ở trang Cart
          quantity: quantity,
        };
        return [...prevItems, newItem];
      }
    });
    alert("Đã thêm vào giỏ hàng!");
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
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);