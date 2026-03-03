import axios from '@/lib/axios';

export const addressService = {

    // 1. Lấy toàn bộ sổ địa chỉ của User
    getAllMyAddresses: async () => {
        try {
            const response = await axios.get('/addresses');
            // Nếu API trả về mảng rỗng hoặc undefined thì gán mặc định là []
            return response.data.result !== undefined ? response.data : { ...response.data, result: [] };
        } catch (error) {
            console.error("Lỗi lấy danh sách địa chỉ:", error);
            return { result: [] };
        }
    },

    // 2. Thêm địa chỉ mới vào sổ
    addNewAddress: async (addressData) => {
        try {
            const response = await axios.post('/addresses', addressData);
            return response.data;
        } catch (error) {
            console.error("Lỗi thêm địa chỉ mới:", error);
            throw error.response?.data || error.message;
        }
    },

    // 3. Lấy địa chỉ mặc định của User hiện tại
    getMyDefaultAddress: async () => {
        try {
            const response = await axios.get('/addresses/default');

            return response.data.result !== undefined ? response.data : { ...response.data, result: null };
        } catch (error) {
            console.error("Lỗi lấy địa chỉ mặc định:", error);
            return { result: null }; // Trả về null nếu chưa có
        }
    },

    // 4. Lưu / Cập nhật địa chỉ mặc định
    saveDefaultAddress: async (addressData) => {
        try {
            const response = await axios.post('/addresses/default', addressData);
            return response.data;
        } catch (error) {
            console.error("Lỗi lưu địa chỉ mặc định:", error);
            throw error.response?.data || error.message;
        }
    }
};