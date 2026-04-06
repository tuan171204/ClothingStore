// ── PATCH for the OrderDetailModal in frontend/src/app/(admin)/admin/orders/page.jsx ──
// Replace the "6. Tổng tiền" section inside OrderDetailModal with this version.
// It shows: subtotal (before discount) → coupon badge → shipping fee → final total.

// ── Drop-in replacement for the totals block (section #6) ────────────────────

export const AdminOrderTotals = ({ order, formatCurrency }) => {
    const discount = Number(order.discountAmount || 0);
    const shipping = Number(order.shippingFee || 0);
    const subtotal = Number(order.subtotal || order.totalAmount - shipping + discount);
    const hasDiscount = discount > 0 || order.couponCode;

    return (
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            {/* Subtotal (items only) */}
            <div className="flex justify-between text-gray-500">
                <span>Tiền hàng</span>
                <span className="font-medium text-gray-700">{formatCurrency(subtotal)}</span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-gray-700">{formatCurrency(shipping)}</span>
            </div>

            {/* Coupon / Discount row — only shown when a coupon was used */}
            {hasDiscount && (
                <div className="flex justify-between items-center text-green-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                        {/* Ticket icon inline SVG (no import needed in this snippet) */}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2">
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                            <path d="M13 5v2M13 17v2M13 11v2" />
                        </svg>
                        Giảm giá
                        {order.couponCode && (
                            <span className="ml-1 font-mono text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                                {order.couponCode}
                            </span>
                        )}
                    </span>
                    <span className="text-green-600">- {formatCurrency(discount)}</span>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-1" />

            {/* Grand total */}
            <div className="flex justify-between font-bold text-gray-800 text-base">
                <span>Tổng thanh toán</span>
                <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
            </div>

            {/* Payment method */}
            <div className="flex justify-between text-gray-500 text-xs pt-1">
                <span>Phương thức</span>
                <span className={`font-semibold ${order.paymentMethod === 'VNPAY' ? 'text-blue-600' : 'text-gray-700'}`}>
                    {order.paymentMethod}
                </span>
            </div>
        </div>
    );
};

// ── HOW TO INTEGRATE ──────────────────────────────────────────────────────────
// In AdminOrderPage (orders/page.jsx), inside <OrderDetailModal>:
//
// 1. Import this component at the top of the file:
//    import { AdminOrderTotals } from '@/components/admin/AdminOrderTotals';
//
// 2. Find the existing section 6 comment "/* 6. Tổng tiền */" and replace the
//    entire <div className="bg-gray-50 rounded-xl p-4..."> block with:
//
//    <AdminOrderTotals order={order} formatCurrency={formatCurrency} />