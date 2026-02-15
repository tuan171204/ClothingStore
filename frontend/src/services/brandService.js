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