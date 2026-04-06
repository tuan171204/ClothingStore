'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Ticket, ChevronRight, Loader2, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import axios from '@/lib/axios';

// ─── helpers ────────────────────────────────────────────────────
const formatCurrency = (n) =>
    n != null
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
        : '—';

const formatDate = (d) =>
    d ? `HSD: ${new Date(d).toLocaleDateString('vi-VN')}` : null;

async function fetchAvailable(orderTotal, cartItems) {
    const res = await axios.post('/coupons/available', {
        orderTotal,
        cartItems: cartItems.map(item => ({
            skuId: item.skuId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
        })),
    });
    return res.data; // List<AvailableCouponResponse>
}

// ─── CouponCard ─────────────────────────────────────────────────
function CouponCard({ coupon, isSelected, onSelect }) {
    const applicable = coupon.applicable;

    return (
        <button
            onClick={() => applicable && onSelect(coupon)}
            disabled={!applicable}
            className={`w-full text-left rounded-xl border transition-all duration-200 overflow-hidden
                ${isSelected
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-400 ring-offset-1'
                    : applicable
                        ? 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm cursor-pointer'
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
        >
            {/* Color stripe */}
            <div className={`h-1 w-full ${applicable ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-200'}`} />

            <div className="p-4 flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                    ${applicable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Ticket size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-mono font-bold text-md tracking-wider
                            ${applicable ? 'text-gray-900' : 'text-gray-500'}`}>
                            {coupon.code}
                        </span>
                        {isSelected && (
                            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                        )}
                        {applicable && !isSelected && (
                            <ChevronRight size={14} className="text-gray-400 shrink-0" />
                        )}
                    </div>

                    {coupon.description && (
                        <p className="text-sm text-gray-500 mb-1.5 line-clamp-1">{coupon.description}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Discount value */}
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full
                            ${applicable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                            {coupon.discountType === 'PERCENTAGE'
                                ? `Giảm ${coupon.discountValue}%`
                                : `Giảm ${formatCurrency(coupon.discountValue)}`}
                            {coupon.maxDiscountAmount
                                ? ` (tối đa ${formatCurrency(coupon.maxDiscountAmount)})`
                                : ''}
                        </span>

                        {/* Min order */}
                        {coupon.minOrderValue && (
                            <span className="text-sm text-gray-400">
                                Đơn từ {formatCurrency(coupon.minOrderValue)}
                            </span>
                        )}

                        {/* Expiry */}
                        {formatDate(coupon.endDate) && (
                            <span className="text-sm text-gray-400">{formatDate(coupon.endDate)}</span>
                        )}
                    </div>

                    {/* Savings highlight — only for applicable coupons */}
                    {applicable && Number(coupon.discountAmount) > 0 && (
                        <div className="mt-2 text-sm font-bold text-green-700">
                            Tiết kiệm: {formatCurrency(coupon.discountAmount)}
                        </div>
                    )}

                    {/* Not-applicable reason */}
                    {!applicable && coupon.notApplicableReason && (
                        <div className="mt-1.5 flex items-center gap-1 text-sm text-amber-600">
                            <AlertCircle size={11} />
                            {coupon.notApplicableReason}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}

// ─── Main Drawer ─────────────────────────────────────────────────
/**
 * CouponSelectDrawer
 *
 * Props:
 *   isOpen         boolean
 *   onClose        () => void
 *   orderTotal     number   — current cart subtotal
 *   cartItems      array    — [{ skuId, productId, quantity, price }]
 *   appliedCoupon  object | null — currently applied coupon response
 *   onApply        (coupon | null) => void
 */
export default function CouponSelectDrawer({
    isOpen,
    onClose,
    orderTotal,
    cartItems,
    appliedCoupon,
    onApply,
}) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [manualError, setManualError] = useState('');
    const [applyingManual, setApplyingManual] = useState(false);

    const load = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        setError('');
        try {
            const list = await fetchAvailable(orderTotal, cartItems);
            setCoupons(list);
        } catch {
            setError('Không thể tải danh sách mã giảm giá. Thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [isOpen, orderTotal]);

    useEffect(() => { load(); }, [load]);

    // Apply by clicking a coupon card
    const handleSelectCard = (coupon) => {
        // If same coupon is clicked again → deselect
        if (appliedCoupon?.code === coupon.code) {
            onApply(null);
        } else {
            onApply({
                code: coupon.code,
                discountAmount: coupon.discountAmount,
                valid: true,
            });
        }
        onClose();
    };

    // Apply manually typed code
    const handleApplyManual = async () => {
        if (!manualCode.trim()) { setManualError('Vui lòng nhập mã'); return; }
        setApplyingManual(true);
        setManualError('');
        try {
            const res = await axios.post('/coupons/apply', {
                code: manualCode.trim().toUpperCase(),
                orderTotal,
                cartItems: cartItems.map(i => ({
                    skuId: i.skuId,
                    productId: i.productId,
                    quantity: i.quantity,
                    price: i.price,
                })),
            });
            const result = res.data;
            if (result?.valid) {
                onApply(result);
                onClose();
            } else {
                setManualError(result?.message || 'Mã không hợp lệ');
            }
        } catch (err) {
            setManualError(err.response?.data?.message || 'Không thể kiểm tra mã. Thử lại sau.');
        } finally {
            setApplyingManual(false);
        }
    };

    const applicableCoupons = coupons.filter(c => c.applicable);
    const notApplicableCoupons = coupons.filter(c => !c.applicable);

    // Backdrop click closes drawer
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer — slides in from the right */}
            <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col
                animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <Ticket size={18} className="text-green-600" />
                        <h2 className="font-bold text-gray-900">Chọn mã giảm giá</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Manual code input */}
                <div className="px-5 py-4 border-b bg-white shrink-0">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Nhập mã thủ công
                    </p>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="VD: SUMMER2026"
                                value={manualCode}
                                onChange={e => { setManualCode(e.target.value.toUpperCase()); setManualError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleApplyManual()}
                                className={`w-full pl-9 pr-3 py-2.5 text-md border rounded-lg font-mono tracking-widest
                                    focus:outline-none focus:ring-2 focus:ring-green-400
                                    ${manualError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            />
                        </div>
                        <button
                            onClick={handleApplyManual}
                            disabled={applyingManual || !manualCode.trim()}
                            className="px-4 py-2.5 bg-gray-900 text-white text-md font-bold rounded-lg
                                hover:bg-black disabled:opacity-50 cursor-pointer transition-colors
                                flex items-center gap-1.5 min-w-[80px] justify-center"
                        >
                            {applyingManual ? <Loader2 size={14} className="animate-spin" /> : 'Áp dụng'}
                        </button>
                    </div>
                    {manualError && (
                        <p className="mt-1.5 flex items-center gap-1 text-red-500 text-sm">
                            <AlertCircle size={11} /> {manualError}
                        </p>
                    )}
                </div>

                {/* Coupon list */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                            <Loader2 size={28} className="animate-spin text-green-400" />
                            <p className="text-md">Đang tải mã giảm giá...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center py-12 text-red-400 gap-2 text-md text-center">
                            <AlertCircle size={24} />
                            <p>{error}</p>
                            <button onClick={load} className="text-blue-500 hover:underline cursor-pointer">Thử lại</button>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-gray-400 gap-3">
                            <Ticket size={36} className="opacity-20" />
                            <p className="text-md">Không có mã giảm giá khả dụng</p>
                        </div>
                    ) : (
                        <>
                            {/* Applicable coupons */}
                            {applicableCoupons.length > 0 && (
                                <div>
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                                        Có thể áp dụng ({applicableCoupons.length})
                                    </p>
                                    <div className="space-y-2">
                                        {applicableCoupons.map(c => (
                                            <CouponCard
                                                key={c.id}
                                                coupon={c}
                                                isSelected={appliedCoupon?.code === c.code}
                                                onSelect={handleSelectCard}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Not applicable coupons */}
                            {notApplicableCoupons.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
                                        Chưa đủ điều kiện ({notApplicableCoupons.length})
                                    </p>
                                    <div className="space-y-2">
                                        {notApplicableCoupons.map(c => (
                                            <CouponCard
                                                key={c.id}
                                                coupon={c}
                                                isSelected={false}
                                                onSelect={() => { }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer — remove applied coupon */}
                {appliedCoupon && (
                    <div className="px-5 py-4 border-t bg-green-50 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-md text-green-800">
                                <CheckCircle2 size={16} className="text-green-600" />
                                <span>Đang áp dụng:</span>
                                <span className="font-mono font-bold">{appliedCoupon.code}</span>
                                <span className="font-bold text-green-700">
                                    (-{formatCurrency(appliedCoupon.discountAmount)})
                                </span>
                            </div>
                            <button
                                onClick={() => { onApply(null); onClose(); }}
                                className="text-sm text-gray-500 hover:text-red-600 font-semibold cursor-pointer transition-colors"
                            >
                                Bỏ mã
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}