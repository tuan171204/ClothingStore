import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/*
THÊM TOKEN VÀO HEADERS MỌI REQUEST
*/
instance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const isAdminRoute = window.location.pathname.startsWith('/admin');

            const token = localStorage.getItem(isAdminRoute ? 'admin_token' : 'token');

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

/*
THÊM INTERCEPTOR CHO RESPONSE (Xử lý khi Token hết hạn - Lỗi 401)
*/
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Nếu API báo lỗi 401 (Unauthorized), tự động xóa token và đá về trang đăng nhập
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                // Tạm thời reload lại trang hoặc redirect về login (Sẽ tối ưu bằng Context sau)
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default instance;