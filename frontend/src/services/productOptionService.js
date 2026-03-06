import axios from '@/lib/axios';

export const productOptionService = {
    // 1. Lấy danh sách thuộc tính của 1 sản phẩm
    getOptionsByProductId: async (productId) => {
        try {
            const response = await axios.get(`/products/${productId}/options`);
            return response.data.result || [];
        } catch (error) {
            console.error("Lỗi lấy danh sách thuộc tính:", error);
            return [];
        }
    },

    // 2. Thêm mới 1 thuộc tính (Kèm các giá trị)
    createOption: async (productId, optionData) => {
        try {
            const response = await axios.post(`/products/${productId}/options`, optionData);
            return response.data.result;
        } catch (error) {
            console.error("Lỗi tạo thuộc tính mới:", error);
            throw error.response?.data || error.message;
        }
    },

    // 3. Thêm giá trị mới vào thuộc tính đã có
    addValueToOption: async (optionId, valueData) => {
        try {
            const response = await axios.post(`/options/${optionId}/values`, valueData);
            return response.data.result;
        } catch (error) {
            console.error("Lỗi thêm giá trị cho thuộc tính:", error);
            throw error.response?.data || error.message;
        }
    },

    // 4. Xóa 1 thuộc tính
    deleteOption: async (optionId) => {
        try {
            const response = await axios.delete(`/options/${optionId}`);
            return response.data.result;
        } catch (error) {
            console.error("Lỗi xóa thuộc tính:", error);
            throw error.response?.data || error.message;
        }
    },

    // 5. Xóa 1 giá trị cụ thể
    deleteOptionValue: async (valueId) => {
        try {
            const response = await axios.delete(`/option-values/${valueId}`);
            return response.data.result;
        } catch (error) {
            console.error("Lỗi xóa giá trị thuộc tính:", error);
            throw error.response?.data || error.message;
        }
    }
};