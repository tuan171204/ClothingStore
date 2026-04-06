'use client';

import { Ticket } from 'lucide-react';

const formatCurrency = (n) =>
    n != null && n !== 0
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
        : null;

/**
 * DiscountInfo — shows coupon code + saved amount in a small badge row.
 * Renders nothing if neither couponCode nor discountAmount is present.
 *
 * Props:
 *   couponCode     string | null
 *   discountAmount number | null
 *   className      string  (optional extra class for the wrapper)
 */
export default function DiscountInfo({ couponCode, discountAmount, className = '' }) {
    const hasDiscount = couponCode || (discountAmount && Number(discountAmount) > 0);
    if (!hasDiscount) return null;

    const formattedDiscount = formatCurrency(discountAmount);

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-md ${className}`}>
            <Ticket size={14} className="text-green-600 shrink-0" />
            {couponCode && (
                <span className="font-mono font-bold text-green-800 tracking-wider">
                    {couponCode}
                </span>
            )}
            {couponCode && formattedDiscount && (
                <span className="text-green-600">·</span>
            )}
            {formattedDiscount && (
                <span className="text-green-700 font-semibold">
                    Giảm {formattedDiscount}
                </span>
            )}
        </div>
    );
}