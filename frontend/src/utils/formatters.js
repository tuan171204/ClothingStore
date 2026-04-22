
export const parseRawNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\D/g, ''); // Dùng Regex xóa mọi ký tự không phải số (Non-digit)
};

export const formatNumberInput = (value) => {
    const rawValue = parseRawNumber(value);
    if (!rawValue) return '';
    return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};