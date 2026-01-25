import axios from '@/lib/axios';

export const getProducts = async () => {
    try {
        const response = await axios.get('/products');
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
};

export const getProductById = async (id) => {
    try {
        const response = await axios.get(`/products/${id}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy chi tiết sản phẩm:", error);
        return null;
    }
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND'
    }).format(amount);
};