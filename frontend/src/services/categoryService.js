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

// Sau này bạn có thể thêm: createCategory, updateCategory, deleteCategory ở đây