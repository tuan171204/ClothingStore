import axios from '@/lib/axios';

export const updateUserProfile = async (userId, updateData) => {
    try {
        const response = await axios.put(`/users/${userId}`, updateData);
        return response.data;
    } catch (error) {
        console.error("Lỗi cập nhật user:", error);
        throw error;
    }
};