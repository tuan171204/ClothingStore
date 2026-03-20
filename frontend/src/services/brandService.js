import axios from '@/lib/axios';

export const getBrands = async () => {
    try {
        const response = await axios.get('/brands');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy thương hiệu:", error);
        return [];
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