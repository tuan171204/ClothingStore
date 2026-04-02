import axios from '@/lib/axios';

/** Flat list with filters — admin use */
export const getCoupons = async ({
    applyType = '', isActive = '', startDate = '', endDate = ''
} = {}) => {
    try {
        const params = {};
        if (applyType) params.applyType = applyType;
        if (isActive !== '') params.isActive = isActive;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await axios.get('/coupons', { params });
        return response.data;
    } catch (error) {
        console.error('Lỗi lấy mã giảm giá:', error);
        return [];
    }
};

/** Paginated + filtered — admin table */
export const getCouponsPaged = async ({
    applyType = '', isActive = '', startDate = '', endDate = '',
    page = 0, size = 10
} = {}) => {
    try {
        const params = { paginate: true, page, size };
        if (applyType) params.applyType = applyType;
        if (isActive !== '') params.isActive = isActive;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await axios.get('/coupons', { params });
        return response.data;
    } catch (error) {
        console.error('Lỗi lấy mã giảm giá (paged):', error);
        return { content: [], page: 0, size, totalElements: 0, totalPages: 0 };
    }
};

export const createCoupon = async (payload) => {
    const response = await axios.post('/coupons', payload);
    return response.data?.result;
};

export const updateCoupon = async (id, payload) => {
    const response = await axios.put(`/coupons/${id}`, payload);
    return response.data?.result;
};

export const deleteCoupon = async (id) => {
    await axios.delete(`/coupons/${id}`);
};

/**
 * Validate + calculate discount for a coupon code at checkout.
 * Does NOT consume the coupon — only verifies and returns discount amount.
 *
 * @param {string} code
 * @param {number} orderTotal
 * @param {Array}  cartItems  – [{ skuId, productId, quantity, price }]
 * @returns {ApplyCouponResponse}
 */
export const applyCoupon = async (code, orderTotal, cartItems = []) => {
    const response = await axios.post('/coupons/apply', {
        code,
        orderTotal,
        cartItems
    });
    return response.data;
};

/** Quick lookup — get coupon details without applying */
export const validateCouponCode = async (code) => {
    const response = await axios.get(`/coupons/validate/${code}`);
    return response.data;
};