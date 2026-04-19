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

/**
 * Lấy chỉ danh mục GỐC (không có cha) — dùng cho CategoryShowcase, TrendingSection.
 */
export const getParentCategories = async () => {
    try {
        const response = await axios.get('/categories', { params: { parentOnly: true } });
        return response.data;
    } catch (error) {
        console.error('Lỗi lấy danh mục gốc:', error);
        return [];
    }
};

/**
 * Lấy danh mục có cấu trúc phân cấp để hiển thị trong filter sidebar.
 * Trả về: [ { id, name, parentId, isParent, children: [...] } ]
 *
 * Gom nhóm: danh mục cha ở trên, danh mục con được indent bên dưới.
 */
export const getCategoriesGrouped = async () => {
    try {
        const response = await axios.get('/categories');
        const all = response.data || [];

        const parents = all.filter(c => !c.parentId);
        const children = all.filter(c => !!c.parentId);

        const grouped = parents.map(p => ({
            ...p,
            isParent: true,
            children: children.filter(c => c.parentId === p.id),
        }));

        const orphans = children.filter(
            c => !parents.find(p => p.id === c.parentId)
        );

        return { grouped, orphans, all };
    } catch (error) {
        console.error('Lỗi lấy danh mục grouped:', error);
        return { grouped: [], orphans: [], all: [] };
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