import axios from '@/lib/axios';

const API_URL = '/notifications';

/**
 * Lấy toàn bộ lịch sử thông báo của Admin
 */
export const getAdminNotifications = async () => {
    const response = await axios.get(`${API_URL}/admin`);
    return response.data;
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
export const markNotificationAsRead = async (id) => {
    const response = await axios.patch(`${API_URL}/${id}/read`);
    return response.data;
};

/**
 * Đánh dấu TẤT CẢ thông báo là đã đọc
 */
export const markAllNotificationsAsRead = async () => {
    const response = await axios.patch(`${API_URL}/read-all`);
    return response.data;
};