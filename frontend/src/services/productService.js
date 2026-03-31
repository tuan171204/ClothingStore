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

/*
* API LẤY SẢN PHẨM CÓ LỌC VÀ PHÂN TRANG
*/
export const getProductsWithFilter = async (params) => {
    try {
        // params sẽ chứa: { categoryId, brandId, minPrice, maxPrice, page, limit }
        const response = await axios.get('/products/filter', { params });
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách sản phẩm lọc:", error);
        return { products: [], totalPages: 0, totalElements: 0 };
    }
};

/*
* API XÓA SẢN PHẨM
*/
export const deleteProduct = async (id) => {
    try {
        const response = await axios.delete(`/products/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi xóa sản phẩm ${id}:`, error);
        throw error; // Ném lỗi để UI hiển thị toast thông báo thất bại
    }
};

/*
* API GET CÁC LOẠI SẢN PHẨM
*/
export const getVariantProdut = async (id) => {
    try {
        const response = await axios.get(`/products/${id}/variants`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi lấy các biến thể sản phẩm ${id}:`, error);
        throw error; // Ném lỗi để UI hiển thị toast thông báo thất bại
    }
};