import axios from '@/lib/axios';

export const getCategories = async () => {
    try {
        const response = await axios.get('/categories');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
        return [];
    }
};

export const createCategory = async (data) => {
    const response = await axios.post('/categories', data);
    return response.data;
};

export const updateCategory = async (id, data) => {
    const response = await axios.put(`/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id) => {
    await axios.delete(`/categories/${id}`);
};