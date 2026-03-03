import axios from '@/lib/axios';

const API_URL = '/orders';

/**
 * 1. TẠO ĐƠN HÀNG MỚI (Dành cho Khách hàng)
 * Payload phải khớp với OrderDTO bên Backend
 */
export const createOrder = async (orderData) => {
    try {
        // Log ra để debug xem dữ liệu gửi đi có đúng district/ward chưa
        console.log("📤 Sending Order Data:", orderData);

        const response = await axios.post(API_URL, orderData);
        return response.data;
    } catch (error) {
        console.error("Lỗi tạo đơn hàng:", error);
        throw error;
    }
};

/**
 * 2. ADMIN DUYỆT ĐƠN & ĐẨY QUA GHN (Dành cho Admin)
 * Gọi API: POST /api/orders/{id}/ship
 */
export const shipOrder = async (orderId) => {
    try {
        const response = await axios.post(`${API_URL}/${orderId}/ship`);
        return response.data;
    } catch (error) {
        console.error("Lỗi duyệt đơn hàng: ", error.response?.data || error.message);
        throw error;
    }
};

/**
 * 3. LẤY CHI TIẾT ĐƠN HÀNG (Dùng cho trang Order Detail / Admin)
 */
export const getOrderById = async (orderId) => {
    try {
        const response = await axios.get(`${API_URL}/${orderId}`);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi lấy thông tin đơn hàng:", error);
        throw error;
    }
};

/**
 * 4. LẤY DANH SÁCH ĐƠN HÀNG (Dùng cho trang History hoặc Admin Dashboard)
 * Có thể thêm param page, size, status sau này
 */
export const getOrders = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách đơn hàng:", error);
        throw error;
    }
};

/**
 * 5. LẤY LỊCH SỬ ĐƠN HÀNG CỦA MỘT USER
 */
export const getOrdersByUser = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("❌ Lỗi lấy lịch sử đơn hàng:", error);
        return [];
    }
};