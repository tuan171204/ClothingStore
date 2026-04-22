const RETURN_REASONS_MAP = {
    'DEFECTIVE': 'Sản phẩm bị lỗi / hư hỏng',
    'WRONG_ITEM': 'Nhận sai sản phẩm / màu / size',
    'NOT_AS_DESCRIBED': 'Sản phẩm không giống mô tả / ảnh',
    'CHANGED_MIND': 'Thay đổi ý định sau khi nhận',
    'MISSING_PARTS': 'Thiếu phụ kiện / phụ liệu đi kèm',
    'OTHER': 'Lý do khác',
};

const formatReturnReason = (rawReason) => {
    if (!rawReason) return '';
    const parts = rawReason.split(' - ');
    const code = parts[0];

    if (RETURN_REASONS_MAP[code]) {
        return `${RETURN_REASONS_MAP[code]} - ${parts.slice(1).join(' - ')}`;
    }
    return rawReason; // Fallback nếu không khớp mã nào
};


export const OrderPriceSummary = ({ order, formatCurrency }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        {/* Left: meta info */}
        <div className="text-md text-gray-500 space-y-1">
            <p>
                Ngày đặt:{' '}
                <span className="font-medium text-gray-900">
                    {new Date(order.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                    -
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </span>
            </p>
            <p>
                Thanh toán:{' '}
                <span className="font-medium text-gray-900">{order.paymentMethod}</span>
            </p>
            {order.cancelReason && (
                <p className="text-red-500">
                    Lý do hủy: <span className="font-medium">"{order.cancelReason}"</span>
                </p>
            )}
            {order.returnReason && (
                <p className="text-amber-600">
                    Lý do hoàn trả:{' '}
                    <span className="font-medium">{formatReturnReason(order.returnReason)}</span>
                </p>
            )}
        </div>

        {/* Right: price breakdown */}
        <div className="sm:text-right shrink-0 space-y-1.5">
            {/* Coupon badge — only shown when a coupon was applied */}
            {(order.couponCode || Number(order.discountAmount) > 0) && (
                <div className="flex sm:justify-end">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" className="text-green-600 shrink-0">
                            <path d="M9 9h.01M15 15h.01M5 12H3m18 0h-2M12 5V3m0 18v-2" />
                            <circle cx="12" cy="12" r="7" />
                        </svg>
                        {order.couponCode && (
                            <span className="font-mono font-bold text-green-800 tracking-wider">
                                {order.couponCode}
                            </span>
                        )}
                        {order.couponCode && Number(order.discountAmount) > 0 && (
                            <span className="text-green-600">·</span>
                        )}
                        {Number(order.discountAmount) > 0 && (
                            <span className="text-green-700 font-semibold">
                                -{formatCurrency(order.discountAmount)}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Subtotal breakdown when discount exists */}
            {Number(order.discountAmount) > 0 && order.subtotal && (
                <div className="text-sm text-gray-400 line-through">
                    {formatCurrency(Number(order.subtotal) + Number(order.shippingFee || 0))} trước giảm
                </div>
            )}

            <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Tổng tiền</div>
            <div className="font-black text-xl text-gray-900">{formatCurrency(order.totalAmount)}</div>
        </div>
    </div>
);