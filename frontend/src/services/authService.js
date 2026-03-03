import axios from '@/lib/axios';

export const authService = {
    // 1. Gửi Email/Mật khẩu để lấy Token
    login: async (username, password) => {
        try {
            const response = await axios.post('/auth/token', {
                username, password
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // 2. Lấy thông tin User đang đăng nhập bằng Token hiện tại
    // không cần gửi token trong params, config axios tự động gửi kèm token trong headers
    getMyInfo: async () => {
        try {
            const response = await axios.get('/users/myInfo');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // 3. Đăng ký tài khoản mới
    register: async (userData) => {
        try {
            const response = await axios.post('/users/registration', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // 4. Đăng xuất (Gọi API Backend để đưa token vào blacklist)
    logout: async (token) => {
        try {
            await axios.post('/auth/logout', { token });
        } catch (error) {
            console.error('Lỗi khi đăng xuất ở Backend', error);
        }
    }
}