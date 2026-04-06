export default function DiscountInfo({ couponCode, discountAmount, className = '' }) {
    const hasDiscount = couponCode || (discountAmount && Number(discountAmount) > 0);
    if (!hasDiscount) return null;

    const formattedDiscount = formatCurrency(discountAmount);

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-md ${className}`}>
            <Ticket size={16} className="text-green-600 shrink-0" />
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