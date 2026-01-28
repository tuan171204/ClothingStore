import axios from '@/lib/axios'; // Đảm bảo import đúng instance axios của bạn

export const createPaymentUrl = async (amount, orderId) => {
    try {
        // Gọi API Backend: /api/v1/payment/create-payment?amount=...
        const response = await axios.get('/payment/create-payment', {
            params: { amount, orderId }
        });
        return response.data; // Trả về link: https://sandbox.vnpayment.vn/...
    } catch (error) {
        console.error("Lỗi tạo link thanh toán:", error);
        throw error;
    }
};

export const verifyPayment = async (params) => {
    try {
        const response = await axios.get('/payment/vn-pay-callback', { params });
        return response.data;
    } catch (error) {
        console.error("Lỗi xác thực:", error);
        throw error;
    }
};