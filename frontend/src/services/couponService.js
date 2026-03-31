import axios from '@/lib/axios';

/**
 * Lấy danh sách tất cả mã giảm giá
 */
export const getCoupons = async () => {
    const response = await axios.get('/coupons');
    return response.data;
};

/**
 * Tạo mã giảm giá mới
 * payload: { code, description, discountType, discountValue, ... }
 */
export const createCoupon = async (payload) => {
    const response = await axios.post('/coupons', payload);
    return response.data?.result;
};

/**
 * Cập nhật thông tin mã giảm giá
 */
export const updateCoupon = async (id, payload) => {
    const response = await axios.put(`/coupons/${id}`, payload);
    return response.data?.result;
};

/**
 * Xóa mã giảm giá theo ID
 */
export const deleteCoupon = async (id) => {
    const response = await axios.delete(`/coupons/${id}`);
    return response.data?.result;
};