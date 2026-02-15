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

/*
* API TẠO SẢN PHẨM
*/
export const createProduct = async (productData) => {
    try {
        const response = await axios.post('/products', productData);
        return response.data;
    } catch (error) {
        console.error("Lỗi tạo sản phẩm:", error);
        throw error; // Ném lỗi để component xử lý (hiển thị Toast)
    }
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND'
    }).format(amount);
};

/*
* API CẬP NHẬT SẢN PHẨM
*/
export const updateProduct = async (id, productData) => {
    try {
        const response = await axios.put(`/products/${id}`, productData);
        return response.data;
    } catch (error) {
        console.error("Lỗi cập nhật sản phẩm:", error);
        throw error;
    }
};