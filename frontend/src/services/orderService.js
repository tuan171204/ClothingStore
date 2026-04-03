import axios from '@/lib/axios';

const API_URL = '/orders';

/**
 * Admin: Lấy danh sách đơn hàng có filter + phân trang
 * params: { keyword, status, paymentMethod, fromDate, toDate, page, size }
 */
export const getOrdersFiltered = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data; // PagedResponse<OrderResponse>
    } catch (error) {
        console.error('❌ Lỗi lấy đơn hàng:', error);
        throw error;
    }
};

/**
 * Admin: Thống kê tổng tiền theo filter
 */
export const getOrderSummary = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/summary`, { params });
        return response.data; // { totalRevenue, totalOrders }
    } catch (error) {
        console.error('❌ Lỗi lấy summary:', error);
        return { totalRevenue: 0, totalOrders: 0 };
    }
};

/**
 * Admin: Cập nhật trạng thái đơn hàng
 */
export const updateOrderStatus = async (orderId, status) => {
    const response = await axios.patch(`${API_URL}/${orderId}/status`, { status });
    return response.data;
};

/**
 * Tạo đơn hàng mới (Khách hàng)
 */
export const createOrder = async (orderData) => {
    try {
        const response = await axios.post(API_URL, orderData);
        return response.data;
    } catch (error) {
        console.error('Lỗi tạo đơn hàng:', error);
        throw error;
    }
};

/**
 * Admin: Duyệt & Gửi GHN
 */
export const shipOrder = async (orderId) => {
    try {
        const response = await axios.post(`${API_URL}/${orderId}/ship`);
        return response.data;
    } catch (error) {
        console.error('Lỗi duyệt đơn hàng:', error.response?.data || error.message);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    const response = await axios.get(`${API_URL}/${orderId}`);
    return response.data;
};

export const getOrders = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getOrdersByUser = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        return [];
    }
};

// ════════════════════════════════════════════════════════════════
// API: HỦY ĐƠN HÀNG
// ════════════════════════════════════════════════════════════════

/**
 * Khách hàng hủy đơn hàng của mình.
 * Chỉ cho phép khi status = PENDING hoặc CONFIRMED.
 *
 * @param {number} orderId - ID đơn hàng
 * @param {string} reason  - Lý do hủy đơn
 * @returns {Promise<OrderResponse>}
 */
export const cancelOrder = async (orderId, reason) => {
    const response = await axios.post(`${API_URL}/${orderId}/cancel`, { reason });
    return response.data;
};

// ════════════════════════════════════════════════════════════════
// API: YÊU CẦU HOÀN TRẢ
// ════════════════════════════════════════════════════════════════

/**
 * Khách hàng gửi yêu cầu hoàn trả sau khi nhận hàng.
 * Chỉ cho phép khi status = COMPLETED.
 *
 * @param {number} orderId      - ID đơn hàng
 * @param {string} reason       - Lý do ngắn gọn (enum: DEFECTIVE, WRONG_ITEM, ...)
 * @param {string} description  - Mô tả chi tiết
 * @param {string[]} imageUrls  - Danh sách URL ảnh đã upload
 * @returns {Promise<OrderResponse>}
 */
export const requestReturnOrder = async (orderId, reason, description, imageUrls) => {
    const response = await axios.post(`${API_URL}/${orderId}/return`, {
        reason,
        description,
        imageUrls,
    });
    return response.data;
};

/**
 * Admin duyệt yêu cầu hoàn trả
 */
export const approveReturnOrder = async (orderId) => {
    const response = await axios.post(`${API_URL}/${orderId}/approve-return`);
    return response.data;
};