import axios from '@/lib/axios';

// API tạo đơn hàng
export const createOrder = async (orderData) => {
    try {
        // orderData phải khớp với OrderDTO bên Backend
        const response = await axios.post('/orders', orderData);
        return response.data;
    } catch (error) {
        console.error("Lỗi tạo đơn hàng:", error);
        throw error;
    }
};