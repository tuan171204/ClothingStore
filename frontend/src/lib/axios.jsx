import axios from 'axios';

const SHOP_TOKEN_KEY = 'token';
const ADMIN_TOKEN_KEY = 'admin_token';
const SHOP_REFRESH_KEY = 'refresh_token';
const ADMIN_REFRESH_KEY = 'admin_refresh_token';

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token)
    );
    failedQueue = [];
};

const getKeys = () => {
    if (typeof window === 'undefined')
        return { accessKey: SHOP_TOKEN_KEY, refreshKey: SHOP_REFRESH_KEY, loginPath: '/login' };
    const isAdmin = window.location.pathname.startsWith('/admin');
    return {
        accessKey: isAdmin ? ADMIN_TOKEN_KEY : SHOP_TOKEN_KEY,
        refreshKey: isAdmin ? ADMIN_REFRESH_KEY : SHOP_REFRESH_KEY,
        loginPath: isAdmin ? '/admin/login' : '/login',
    };
};

const forceLogout = () => {
    if (typeof window === 'undefined') return;
    [SHOP_TOKEN_KEY, ADMIN_TOKEN_KEY, SHOP_REFRESH_KEY, ADMIN_REFRESH_KEY]
        .forEach(k => localStorage.removeItem(k));
    const { loginPath } = getKeys();
    if (!window.location.pathname.includes('/login')) {
        window.location.href = loginPath;
    }
};

/*
THÊM TOKEN VÀO HEADERS MỌI REQUEST
*/
instance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const { accessKey } = getKeys();
            const token = localStorage.getItem(accessKey);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/*
THÊM INTERCEPTOR CHO RESPONSE (Xử lý khi Token hết hạn - Lỗi 401)
*/
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response || error.response.status !== 401)
            return Promise.reject(error);

        if (originalRequest.url?.includes('/auth/refresh')) {
            forceLogout();
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            forceLogout();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return instance(originalRequest);
            });
        }

        // Start refresh
        originalRequest._retry = true;
        isRefreshing = true;

        const { accessKey, refreshKey } = getKeys();

        /*
         * HOW THIS WORKS WITH YOUR BACKEND:
         * On initial login, store the access token under BOTH keys:
         *   localStorage.setItem('token', result.token)
         *   localStorage.setItem('refresh_token', result.token)   ← same value
         *
         * backend POST /auth/refresh accepts { token: "<access_token>" }
         * and issues a NEW access token (invalidating the old one).
         * This is the only change needed in AuthContext — no backend changes.
         */
        const refreshToken = localStorage.getItem(refreshKey);

        if (!refreshToken) {
            isRefreshing = false;
            forceLogout();
            return Promise.reject(error);
        }

        try {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                { token: refreshToken },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const newToken = data?.result?.token;
            if (!newToken) throw new Error('No token in refresh response');

            localStorage.setItem(accessKey, newToken);
            localStorage.setItem(refreshKey, newToken); // keep refresh key updated too

            instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            processQueue(null, newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError, null);
            forceLogout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default instance;