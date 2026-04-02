import axios from '@/lib/axios';

/** Flat list — used for dropdowns */
export const getCategories = async (keyword = '', parentOnly = false) => {
    try {
        const params = {};
        if (keyword) params.keyword = keyword;
        if (parentOnly) params.parentOnly = true;
        const response = await axios.get('/categories', { params });
        return response.data;
    } catch (error) {
        console.error('Lỗi lấy danh mục:', error);
        return [];
    }
};

/** Paginated list — used for admin table */
export const getCategoriesPaged = async ({
    keyword = '', parentOnly = false, page = 0, size = 10
} = {}) => {
    try {
        const params = { paginate: true, page, size };
        if (keyword?.trim()) params.keyword = keyword.trim();
        if (parentOnly) params.parentOnly = true;
        const response = await axios.get('/categories', { params });
        return response.data; // PagedResponse<CategoryResponse>
    } catch (error) {
        console.error('Lỗi lấy danh mục (paged):', error);
        return { content: [], page: 0, size, totalElements: 0, totalPages: 0 };
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