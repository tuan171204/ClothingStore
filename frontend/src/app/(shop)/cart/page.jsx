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

    useEffect(() => {
        setHasWarnings(cartItems.some(i => i.stockWarning));
    }, [cartItems]);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-36 h-36 sm:w-48 sm:h-48 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl sm:text-4xl">🛒</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-600 mb-4 text-center">Giỏ hàng của bạn đang trống</h2>
                <Link href="/">
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base">
                        Tiếp tục mua sắm
                    </button>
                </Link>
            </div>
        );
    }

    return (
        // ADDED: px-3 on mobile, px-4 on sm+; reduced top padding
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 bg-gray-50 min-h-screen mt-16 sm:mt-20">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                {/* ADDED: smaller text on mobile */}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Giỏ hàng ({cartItems.length} sản phẩm)
                </h1>
                <button
                    onClick={async () => {
                        setIsValidating(true);
                        await validateCart();
                        setIsValidating(false);
                    }}
                    disabled={isValidating}
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <RefreshCw size={13} className={isValidating ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">Cập nhật giỏ hàng</span>
                    <span className="sm:hidden">Cập nhật</span>
                </button>
            </div>

            {hasWarnings && (
                <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-amber-800 text-sm sm:text-base">
                            Một số sản phẩm trong giỏ hàng đã thay đổi
                        </p>
                        <p className="text-xs sm:text-sm text-amber-700 mt-1">
                            Số lượng đã được điều chỉnh theo tồn kho hiện tại.
                        </p>
                    </div>
                </div>
            )}

            {/* ADDED: flex-col on mobile, flex-row on lg+ */}
            <div className="flex flex-col lg:flex-row gap-5 sm:gap-8">
                {/* PRODUCT LIST */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {cartItems.map((item) => (
                                <div key={item.skuId} className={`p-3 sm:p-4 ${item.stockWarning ? 'bg-amber-50/50' : ''}`}>
                                    {item.stockWarning && item.warningMessage && (
                                        <div className="mb-2 sm:mb-3 flex items-center gap-2 text-amber-700 text-xs sm:text-sm font-medium">
                                            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                                            <span>{item.warningMessage}</span>
                                        </div>
                                    )}

                                    {/* CHANGED: use a simpler flex layout that works on all screen sizes */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        {/* Delete button */}
                                        <button
                                            onClick={() => removeFromCart(item.skuId)}
                                            className="text-black hover:text-white bg-red-500 hover:bg-red-600 transition p-2 sm:p-3 rounded-xl cursor-pointer shrink-0 mt-1"
                                        >
                                            <Trash2 size={15} />
                                        </button>

                                        {/* Image — ADDED: smaller on mobile */}
                                        <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-200">
                                            <img
                                                src={item.thumbnailUrl || item.thumbnail || "https://placehold.co/120x120?text=No+Image"}
                                                alt={item.productName || item.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>

                                        {/* Info + controls */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm sm:text-base md:text-xl text-gray-800 line-clamp-2">
                                                {item.productName || item.name}
                                            </p>
                                            <div className="text-xs sm:text-sm text-gray-700 mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded truncate max-w-full">
                                                {item.variantName}
                                            </div>
                                            <div className={`text-xs sm:text-sm mt-1 ${item.stockAvailable <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                                                Còn lại: {item.stockAvailable}
                                            </div>

                                            {/* ADDED: stack price + qty on mobile, side-by-side on sm+ */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2 sm:mt-3">
                                                {/* Price */}
                                                <div>
                                                    <span className="font-bold text-red-600 text-base sm:text-lg">
                                                        {formatCurrency(item.price)}
                                                    </span>
                                                    {item.originalPrice && item.originalPrice > item.price && (
                                                        <span className="text-xs text-gray-400 line-through ml-2">
                                                            {formatCurrency(item.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quantity controls — ADDED: min touch targets */}
                                                <div className={`flex items-center border rounded-lg h-10 self-start sm:self-auto ${item.stockWarning ? 'border-amber-400' : 'border-gray-300'}`}>
                                                    <button
                                                        onClick={() => updateQuantity(item.skuId, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-l-lg"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val) && val >= 1 && val <= item.stockAvailable) {
                                                                updateQuantity(item.skuId, val);
                                                            }
                                                        }}
                                                        className="w-10 h-full text-center text-sm font-medium text-gray-800 focus:outline-none bg-transparent"
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.skuId, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stockAvailable}
                                                        className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-r-lg"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                {/* Subtotal */}
                                                <span className="font-bold text-red-600 text-sm sm:text-base sm:ml-2">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SIDEBAR — ADDED: full width on mobile, fixed width on lg+ */}
                <div className="w-full lg:w-80 xl:w-96 shrink-0">
                    {/* ADDED: sticky only on large screens */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-24">
                        <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                            Tổng quan đơn hàng
                        </h3>
                        <div className="flex justify-between mb-2 text-gray-600 text-sm sm:text-base">
                            <span>Tạm tính:</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>
                        <div className="border-t pt-4 flex justify-between items-center mb-5 sm:mb-6">
                            <span className="font-bold text-base sm:text-lg text-gray-800">Tổng cộng:</span>
                            <span className="font-bold text-xl sm:text-2xl text-red-600">
                                {formatCurrency(cartTotal)}
                            </span>
                        </div>

                        <Link
                            href="/checkout"
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base sm:text-lg text-white transition-all duration-300 ${hasWarnings
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-gray-900 hover:bg-black'
                                }`}
                        >
                            {hasWarnings ? "Xem lại & Thanh toán" : "Tiến hành Thanh toán"}
                            <ArrowRight size={20} />
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