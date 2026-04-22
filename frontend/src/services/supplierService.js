import axios from '@/lib/axios';

/**
 * Lấy danh sách nhà cung cấp có phân trang và tìm kiếm.
 */
export const getSuppliers = async ({
    keyword = '',
    activeOnly = false,
    page = 0,
    size = 10
} = {}) => {
    try {
        const params = { page, size, activeOnly };
        if (keyword?.trim()) params.keyword = keyword.trim();
        const response = await axios.get('/suppliers', { params });
        return response.data;
    } catch (error) {
        console.error('Lỗi lấy danh sách nhà cung cấp:', error);
        return { result: { content: [], page: 0, size, totalElements: 0, totalPages: 0 } };
    }
};

/**
 * Danh sách gọn cho dropdown — chỉ NCC đang hoạt động.
 */
export const getActiveSuppliersSummary = async () => {
    try {
        const response = await axios.get('/suppliers/active-summary');
        return response.data?.result || [];
    } catch (error) {
        console.error('Lỗi lấy dropdown nhà cung cấp:', error);
        return [];
    }
};

/**
 * Lấy chi tiết nhà cung cấp theo ID.
 */
export const getSupplierById = async (id) => {
    try {
        const response = await axios.get(`/suppliers/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi lấy chi tiết nhà cung cấp ${id}:`, error);
        return null;
    }
};

/**
 * Tạo nhà cung cấp mới.
 */
export const createSupplier = async (data) => {
    const response = await axios.post('/suppliers', data);
    return response.data;
};

/**
 * Cập nhật thông tin nhà cung cấp.
 */
export const updateSupplier = async (id, data) => {
    const response = await axios.put(`/suppliers/${id}`, data);
    return response.data;
};

/**
 * Ẩn nhà cung cấp (soft delete).
 */
export const deleteSupplier = async (id) => {
    await axios.delete(`/suppliers/${id}`);
};