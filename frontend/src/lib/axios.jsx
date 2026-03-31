import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
})

/*
THÊM TOKEN VÀO HEADERS MỌI REQUEST
*/
axiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Biến cờ để ngăn gọi refresh liên tục khi có nhiều API cùng lỗi 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/*
Bắt lỗi Response và Auto Refresh Token
*/

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Hết hạn Token) và chưa từng retry
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Bỏ qua nếu chính API refresh hoặc login bị 401
            if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/token')) {
                return Promise.reject(error);
            }

            // Nếu đang refresh dở, các request khác bị 401 sẽ vào hàng đợi (Queue)
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const currentToken = localStorage.getItem('admin_token') || localStorage.getItem('token');

                // Dùng axios mặc định để không bị lặp vô tận vào interceptor
                const refreshResponse = await axios.post(`${axiosInstance.defaults.baseURL}/auth/refresh`, {
                    token: currentToken
                });

                const newToken = refreshResponse.data.result.token;

                // Cập nhật token mới vào đúng nơi
                if (localStorage.getItem('admin_token')) {
                    localStorage.setItem('admin_token', newToken);
                } else {
                    localStorage.setItem('token', newToken);
                }

                // Cập nhật header mặc định
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Giải phóng các request đang chờ trong Queue
                processQueue(null, newToken);

                // Retry lại request ban đầu bị fail
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                // Nếu refresh thất bại (Token vượt quá REFRESHABLE_DURATION) -> Xóa sạch và văng ra Login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('admin_token');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;