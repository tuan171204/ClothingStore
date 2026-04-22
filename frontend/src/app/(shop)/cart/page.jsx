"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, AlertTriangle, RefreshCw, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/services/productService";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, validateCart } = useCart();
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

    // [FIX] Phân biệt sản phẩm hết hàng (stockAvailable === 0) và sản phẩm có cảnh báo số lượng
    const outOfStockItems = cartItems.filter(i => i.stockAvailable === 0);
    const hasOutOfStock = outOfStockItems.length > 0;

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
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 bg-gray-50 min-h-screen mt-16 sm:mt-20">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
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

            {/* [FIX] Banner hết hàng — cảnh báo rõ ràng hơn, hướng dẫn xóa sp */}
            {hasOutOfStock && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-bold text-red-800 text-sm sm:text-base">
                                {outOfStockItems.length} sản phẩm trong giỏ đã hết hàng
                            </p>
                            <p className="text-xs sm:text-sm text-red-600 mt-1">
                                Vui lòng xóa các sản phẩm hết hàng (được đánh dấu đỏ bên dưới) trước khi tiến hành thanh toán.
                            </p>
                            {/* Nút xóa tất cả sản phẩm hết hàng cùng lúc */}
                            <button
                                onClick={() => outOfStockItems.forEach(i => removeFromCart(i.skuId))}
                                className="mt-2 text-xs font-bold text-red-600 underline hover:text-red-800 cursor-pointer"
                            >
                                Xóa tất cả sản phẩm hết hàng ({outOfStockItems.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner cảnh báo số lượng thay đổi (không phải hết hàng) */}
            {hasWarnings && !hasOutOfStock && (
                <div className="mb-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-amber-800 text-sm sm:text-base">
                            Một số sản phẩm trong giỏ hàng đã thay đổi số lượng
                        </p>
                        <p className="text-xs sm:text-sm text-amber-700 mt-1">
                            Số lượng đã được điều chỉnh theo tồn kho hiện tại.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-5 sm:gap-8">
                {/* PRODUCT LIST */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {cartItems.map((item) => {
                                // [FIX] Phân biệt hết hàng hoàn toàn vs số lượng bị giảm
                                const isActuallyOutOfStock = item.stockAvailable === 0;

                                return (
                                    <div
                                        key={item.skuId}
                                        className={`p-3 sm:p-4 transition-colors ${isActuallyOutOfStock
                                                ? 'bg-red-50/60 border-l-4 border-red-400'
                                                : item.stockWarning
                                                    ? 'bg-amber-50/50'
                                                    : ''
                                            }`}
                                    >
                                        {/* [FIX] Thông báo hết hàng rõ ràng */}
                                        {isActuallyOutOfStock && (
                                            <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2 text-red-700 text-xs sm:text-sm font-bold">
                                                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                                                    <span>Sản phẩm này đã hết hàng — vui lòng xóa khỏi giỏ trước khi thanh toán</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.skuId)}
                                                    className="text-xs font-bold text-red-600 underline hover:text-red-800 whitespace-nowrap cursor-pointer"
                                                >
                                                    Xóa ngay
                                                </button>
                                            </div>
                                        )}

                                        {/* Cảnh báo số lượng thay đổi (không phải hết hàng) */}
                                        {!isActuallyOutOfStock && item.stockWarning && item.warningMessage && (
                                            <div className="mb-2 sm:mb-3 flex items-center gap-2 text-amber-700 text-xs sm:text-sm font-medium">
                                                <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                                                <span>{item.warningMessage}</span>
                                            </div>
                                        )}

                                        <div className={`flex items-start gap-3 sm:gap-4 ${isActuallyOutOfStock ? 'opacity-60' : ''}`}>
                                            {/* Delete button */}
                                            <button
                                                onClick={() => removeFromCart(item.skuId)}
                                                className="text-black hover:text-white bg-red-500 hover:bg-red-600 transition p-2 sm:p-3 rounded-xl cursor-pointer shrink-0 mt-1"
                                            >
                                                <Trash2 size={15} />
                                            </button>

                                            {/* Image */}
                                            <div className={`w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg overflow-hidden shrink-0 border ${isActuallyOutOfStock ? 'border-red-200' : 'border-gray-200'} bg-white`}>
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

                                                {/* [FIX] Hiển thị trạng thái tồn kho rõ ràng hơn */}
                                                <div className={`text-xs sm:text-sm mt-1 font-medium ${isActuallyOutOfStock
                                                        ? 'text-red-600'
                                                        : item.stockAvailable <= 5
                                                            ? 'text-orange-500'
                                                            : 'text-green-600'
                                                    }`}>
                                                    {isActuallyOutOfStock
                                                        ? '⚠️ Hết hàng'
                                                        : `Còn lại: ${item.stockAvailable}`}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2 sm:mt-3">
                                                    {/* Price */}
                                                    <div>
                                                        <span className={`font-bold text-base sm:text-lg ${isActuallyOutOfStock ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                                                            {formatCurrency(item.price)}
                                                        </span>
                                                        {item.originalPrice && item.originalPrice > item.price && (
                                                            <span className="text-xs text-gray-400 line-through ml-2">
                                                                {formatCurrency(item.originalPrice)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Quantity controls — disabled khi hết hàng */}
                                                    <div className={`flex items-center border rounded-lg h-10 self-start sm:self-auto ${isActuallyOutOfStock
                                                            ? 'border-red-300 opacity-50'
                                                            : item.stockWarning
                                                                ? 'border-amber-400'
                                                                : 'border-gray-300'
                                                        }`}>
                                                        <button
                                                            onClick={() => updateQuantity(item.skuId, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || isActuallyOutOfStock}
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
                                                            disabled={isActuallyOutOfStock}
                                                            className="w-10 h-full text-center text-sm font-medium text-gray-800 focus:outline-none bg-transparent disabled:opacity-50"
                                                        />
                                                        <button
                                                            onClick={() => updateQuantity(item.skuId, item.quantity + 1)}
                                                            disabled={item.quantity >= item.stockAvailable || isActuallyOutOfStock}
                                                            className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-r-lg"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Subtotal */}
                                                    <span className={`font-bold text-sm sm:text-base sm:ml-2 ${isActuallyOutOfStock ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SIDEBAR */}
                <div className="w-full lg:w-80 xl:w-96 shrink-0">
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

                        {/* [FIX] Nếu có sp hết hàng: disable nút, hiện thông báo */}
                        {hasOutOfStock ? (
                            <div className="space-y-3">
                                <div className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white bg-gray-300 cursor-not-allowed opacity-70">
                                    <AlertTriangle size={18} />
                                    Có sản phẩm hết hàng
                                </div>
                                <p className="text-xs text-red-600 text-center">
                                    Vui lòng xóa sản phẩm hết hàng trước khi thanh toán
                                </p>
                            </div>
                        ) : (
                            <Link
                                href="/checkout"
                                className={`group relative w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base sm:text-lg text-white transition-all duration-300 hover:-translate-y-1 ${hasWarnings
                                        ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/40'
                                        : 'bg-gray-900 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/40'
                                    }`}
                            >
                                {!hasWarnings && (
                                    <span className="absolute inset-0 rounded-xl bg-gray-900 opacity-20 group-hover:animate-ping" />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    {hasWarnings ? "Xem lại & Thanh toán" : "Tiến hành Thanh toán"}
                                    <ArrowRight
                                        size={20}
                                        className="transition-transform duration-300 group-hover:translate-x-1.5"
                                    />
                                </span>
                            </Link>
                        )}

                        {hasWarnings && !hasOutOfStock && (
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