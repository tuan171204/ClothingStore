"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/services/productService";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity,
        cartTotal, validateCart } = useCart();
    const [isValidating, setIsValidating] = useState(false);
    const [hasWarnings, setHasWarnings] = useState(false);

    // Validate cart khi mở trang
    useEffect(() => {
        const validate = async () => {
            setIsValidating(true);
            const result = await validateCart();
            if (result?.items?.some(i => i.stockWarning)) {
                setHasWarnings(true);
            }
            setIsValidating(false);
        };
        validate();
    }, []);

    // Tính lại hasWarnings mỗi khi cartItems đổi
    useEffect(() => {
        setHasWarnings(cartItems.some(i => i.stockWarning));
    }, [cartItems]);

    // --- Hàm xử lý thay đổi số lượng ---
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

    // --- Hàm xử lý nhập số trực tiếp ---
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🛒</span>
                </div>
                <h2 className="text-xl font-bold text-gray-600 mb-4">Giỏ hàng của bạn đang trống</h2>
                <Link href="/">
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-blue-700 transition">
                        Tiếp tục mua sắm
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen mt-20">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Giỏ hàng ({cartItems.length} sản phẩm)
                </h1>
                <button
                    onClick={async () => {
                        setIsValidating(true);
                        await validateCart();
                        setIsValidating(false);
                    }}
                    disabled={isValidating}
                    className="flex items-center gap-2 text-sm text-gray-500 
                               hover:text-gray-900 transition-colors"
                >
                    <RefreshCw size={14} className={isValidating ? "animate-spin" : ""} />
                    Cập nhật giỏ hàng
                </button>
            </div>

            {/* === GLOBAL STOCK WARNING BANNER === */}
            {hasWarnings && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 
                                rounded-lg flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-amber-800">
                            Một số sản phẩm trong giỏ hàng đã thay đổi
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                            Số lượng đã được điều chỉnh theo tồn kho hiện tại.
                            Vui lòng kiểm tra lại trước khi thanh toán.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* --- DANH SÁCH SẢN PHẨM --- */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {cartItems.map((item) => (
                                <div key={item.skuId} className={`p-4 ${item.stockWarning ? 'bg-amber-50/50' : ''
                                    }`}>
                                    {/* === INLINE STOCK WARNING === */}
                                    {item.stockWarning && item.warningMessage && (
                                        <div className="mb-3 flex items-center gap-2 
                                                        text-amber-700 text-sm font-medium">
                                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                            <span>{item.warningMessage}</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col md:grid md:grid-cols-12 
                                                    gap-4 items-center">
                                        {/* Cột ảnh + tên — giữ nguyên code cũ */}
                                        <div className="col-span-6 flex items-center gap-4 w-full">
                                            <button
                                                onClick={() => removeFromCart(item.skuId)}
                                                className="text-black hover:text-white bg-red-500 
                                                           hover:bg-red-600 transition p-3 
                                                           rounded-xl cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="w-30 h-30 rounded-lg overflow-hidden 
                                                            shrink-0 bg-white border border-gray-200">
                                                <img src={item.thumbnailUrl || item.thumbnail || "https://placehold.co/120x120?text=No+Image"}
                                                    alt={item.productName || item.name}
                                                    className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-xl text-gray-800">
                                                    {item.productName || item.name}
                                                </p>
                                                <div className="text-md text-gray-700 mt-1 
                                                                bg-gray-100 inline-block 
                                                                px-2 py-1 rounded">
                                                    {item.variantName}
                                                </div>
                                                <div className={`text-md mt-1 ${item.stockAvailable <= 5
                                                    ? 'text-red-500'
                                                    : 'text-green-600'
                                                    }`}>
                                                    Còn lại: {item.stockAvailable}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Giá */}
                                        <div className="col-span-2 text-center text-blue-600 
                                                        font-bold text-lg hidden md:block">
                                            {formatCurrency(item.price)}
                                        </div>

                                        {/* Số lượng */}
                                        <div className="col-span-2 flex justify-center">
                                            <div className={`flex items-center border rounded-lg h-10 ${item.stockWarning
                                                ? 'border-amber-400'
                                                : 'border-gray-300'
                                                }`}>
                                                <button
                                                    onClick={() => updateQuantity(
                                                        item.skuId, item.quantity - 1
                                                    )}
                                                    disabled={item.quantity <= 1}
                                                    className="px-3 h-full flex items-center 
                                                               text-gray-600 hover:bg-gray-100 
                                                               disabled:opacity-30 rounded-l-lg"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val) && val >= 1
                                                            && val <= item.stockAvailable) {
                                                            updateQuantity(item.skuId, val);
                                                        }
                                                    }}
                                                    className="w-12 h-full text-center text-sm 
                                                               font-medium text-gray-800 
                                                               focus:outline-none bg-transparent"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(
                                                        item.skuId, item.quantity + 1
                                                    )}
                                                    disabled={item.quantity >= item.stockAvailable}
                                                    className="px-3 h-full flex items-center 
                                                               text-gray-600 hover:bg-gray-100 
                                                               disabled:opacity-30 rounded-r-lg"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Thành tiền */}
                                        <div className="col-span-2 text-center font-bold 
                                                        text-red-600 text-lg">
                                            {formatCurrency(item.price * item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- SIDEBAR TỔNG TIỀN --- */}
                <div className="w-full lg:w-96">
                    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                            Tổng quan đơn hàng
                        </h3>
                        <div className="flex justify-between mb-2 text-gray-600">
                            <span>Tạm tính:</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>
                        <div className="border-t pt-4 flex justify-between items-center mb-6">
                            <span className="font-bold text-lg text-gray-800">Tổng cộng:</span>
                            <span className="font-bold text-2xl text-red-600">
                                {formatCurrency(cartTotal)}
                            </span>
                        </div>

                        <Link
                            href="/checkout"
                            className={`w-full flex items-center justify-center gap-2 
                                       py-4 rounded-xl font-bold text-lg text-white 
                                       transition-all duration-300 ${hasWarnings
                                    ? 'bg-amber-500 hover:bg-amber-600'
                                    : 'bg-gray-900 hover:bg-black'
                                }`}
                        >
                            {hasWarnings
                                ? "Xem lại & Thanh toán"
                                : "Tiến hành Thanh toán"
                            }
                            <ArrowRight size={22} />
                        </Link>

                        {hasWarnings && (
                            <p className="text-xs text-amber-600 text-center mt-2">
                                ⚠️ Một số sản phẩm đã được điều chỉnh số lượng
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}