import axios from '@/lib/axios';

/** Flat list — used for dropdowns */
export const getBrands = async (keyword = '') => {
    try {
        const params = keyword ? { keyword } : {};
        const response = await axios.get('/brands', { params });
        return response.data;
    } catch (error) {
        console.error('Lỗi lấy thương hiệu:', error);
        return [];
    }
};

/** Paginated list — used for admin table */
export const getBrandsPaged = async ({ keyword = '', page = 0, size = 10 } = {}) => {
    try {
        const params = { paginate: true, page, size };
        if (keyword?.trim()) params.keyword = keyword.trim();
        const response = await axios.get('/brands', { params });
        return response.data; // PagedResponse<BrandResponse>
    } catch (error) {
        console.error('Lỗi lấy thương hiệu (paged):', error);
        return { content: [], page: 0, size, totalElements: 0, totalPages: 0 };
    }
};

export const createBrand = async (data) => {
    const response = await axios.post('/brands', data);
    return response.data;
};

export const updateBrand = async (id, data) => {
    const response = await axios.put(`/brands/${id}`, data);
    return response.data;
};

export const deleteBrand = async (id) => {
    await axios.delete(`/brands/${id}`);
};