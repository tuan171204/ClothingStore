"use client";
import React from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/services/productService";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

    // --- Hàm xử lý thay đổi số lượng (Mới) ---
    const handleQuantityChange = (skuId, currentQty, stock, type) => {
        if (type === 'decrease') {
            if (currentQty > 1) updateQuantity(skuId, currentQty - 1);
        } else {
            // Kiểm tra tồn kho trước khi tăng
            if (currentQty < stock) {
                updateQuantity(skuId, currentQty + 1);
            } else {
                // Có thể hiện Toast/Alert nhỏ ở đây nếu muốn
                // alert(`Kho chỉ còn ${stock} sản phẩm`);
            }
        }
    };

    // --- Hàm xử lý nhập số trực tiếp (Mới) ---
    const handleInputChange = (e, skuId, stock) => {
        const val = parseInt(e.target.value);

        // Nếu xóa hết số hoặc nhập linh tinh -> Mặc định là 1
        if (isNaN(val) || val < 1) {
            updateQuantity(skuId, 1);
            return;
        }

        // Nếu nhập quá tồn kho -> Set về max tồn kho
        if (val > stock) {
            updateQuantity(skuId, stock);
        } else {
            updateQuantity(skuId, val);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
                {/* Bạn nhớ copy file empty-cart.png vào thư mục public nhé, hoặc dùng ảnh placeholder */}
                <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🛒</span>
                </div>
                <h2 className="text-xl font-bold text-gray-600 mb-4">Giỏ hàng của bạn đang trống</h2>
                <Link href="/">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Tiếp tục mua sắm
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Giỏ hàng ({cartItems.length} sản phẩm)</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* --- DANH SÁCH SẢN PHẨM --- */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {/* Header bảng (Ẩn trên mobile) */}
                        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-100 font-semibold text-gray-600 text-sm">
                            <div className="col-span-6">Sản phẩm</div>
                            <div className="col-span-2 text-center">Đơn giá</div>
                            <div className="col-span-2 text-center">Số lượng</div>
                            <div className="col-span-2 text-center">Thành tiền</div>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-gray-100">
                            {cartItems.map((item) => {
                                // Tính toán trạng thái disable
                                const isMaxStock = item.quantity >= item.stock;
                                const isMinQty = item.quantity <= 1;

                                return (
                                    <div key={item.skuId} className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center">

                                        {/* Cột 1: Ảnh & Tên */}
                                        <div className="col-span-6 flex items-center gap-4 w-full">
                                            <button
                                                onClick={() => removeFromCart(item.skuId)}
                                                className="text-black hover:text-white bg-red-500 hover:bg-red-600 transition p-3 rounded-xl cursor-pointer"
                                                title="Xóa sản phẩm"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="w-30 h-30 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-200">
                                                <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain" />
                                            </div>

                                            <div>
                                                <Link href={`/products/${item.productId}`} className="font-medium text-xl text-gray-800 hover:text-blue-600 line-clamp-2">
                                                    {item.name}
                                                </Link>
                                                <div className="text-md text-gray-700 mt-1 bg-gray-100 inline-block px-2 py-1 rounded">
                                                    {item.variantName}
                                                </div>
                                                {/* Hiển thị tồn kho để khách biết */}
                                                <div className="text-md text-red-500 mt-1">
                                                    Còn lại: {item.stock}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cột 2: Đơn giá */}
                                        <div className="col-span-2 text-center text-blue-600 font-bold text-lg hidden md:block">
                                            {formatCurrency(item.price)}
                                        </div>

                                        {/* Cột 3: Số lượng (ĐÃ NÂNG CẤP) */}
                                        <div className="col-span-2 flex justify-center w-full md:w-auto mt-4 md:mt-0">
                                            <div className="flex items-center border border-gray-300 rounded-lg h-10">
                                                {/* Nút Trừ */}
                                                <button
                                                    onClick={() => handleQuantityChange(item.skuId, item.quantity, item.stock, 'decrease')}
                                                    disabled={isMinQty}
                                                    className="px-3 h-full flex items-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-l-lg transition"
                                                >
                                                    <Minus size={14} />
                                                </button>

                                                {/* Ô Nhập liệu */}
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleInputChange(e, item.skuId, item.stock)}
                                                    className="w-12 h-full text-center text-sm font-medium text-gray-800 focus:outline-none bg-transparent appearance-none" // appearance-none để ẩn nút mũi tên mặc định của browser
                                                />

                                                {/* Nút Cộng */}
                                                <button
                                                    onClick={() => handleQuantityChange(item.skuId, item.quantity, item.stock, 'increase')}
                                                    disabled={isMaxStock}
                                                    className="px-3 h-full flex items-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-r-lg transition"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Cột 4: Thành tiền */}
                                        <div className="col-span-2 text-center font-bold text-red-600 text-lg w-full md:w-auto flex justify-between md:block mt-2 md:mt-0">
                                            <span className="md:hidden text-gray-500 text-sm font-normal">Thành tiền:</span>
                                            {formatCurrency(item.price * item.quantity)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- CỘT TỔNG TIỀN (SIDEBAR) --- */}
                <div className="w-full lg:w-96">
                    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24"> {/* top-24 để không bị Header che */}
                        <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Tổng quan đơn hàng</h3>

                        <div className="flex justify-between mb-2 text-gray-600">
                            <span>Tạm tính:</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>

                        <div className="flex justify-between mb-4 text-gray-600">
                            <span>Giảm giá:</span>
                            <span>0 đ</span>
                        </div>

                        <div className="border-t pt-4 flex justify-between items-center mb-6">
                            <span className="font-bold text-lg text-gray-800">Tổng cộng:</span>
                            <span className="font-bold text-2xl text-red-600">{formatCurrency(cartTotal)}</span>
                        </div>

                        <Link href="/checkout">
                            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 cursor-pointer">
                                Tiến hành Thanh toán <ArrowRight size={20} />
                            </button>
                        </Link>

                        <div className="mt-4 text-center">
                            <Link href="/" className="text-sm text-blue-500 hover:underline">
                                Quay lại mua thêm
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}