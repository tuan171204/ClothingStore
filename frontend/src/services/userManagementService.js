/**
 * userManagementService.js
 *
 * Tầng gọi API cho tính năng quản lý người dùng (Admin).
 *
 * Convention:
 *   - Mỗi hàm chỉ làm 1 việc: gọi 1 endpoint
 *   - Không chứa UI logic, không import React/hooks
 *   - Throw error để page.jsx tự xử lý (hiện toast, cập nhật state)
 *   - Unwrap response.data ở đây để page.jsx không cần biết cấu trúc Axios
 *
 * Base URL (qua axios instance): /api/v1/management
 */

import axios from '@/lib/axios';

const BASE = '/management';

// ════════════════════════════════════════════════════════
// CUSTOMERS
// ════════════════════════════════════════════════════════

/**
 * Lấy danh sách khách hàng có phân trang và filter.
 * @returns {Promise<PagedResponse<UserDetailResponse>>}
 */
export const getCustomers = async ({
    keyword = '',
    active = '',       // '' | true | false
    provider = '',     // '' | 'LOCAL' | 'GOOGLE'
    fromDate = '',     // 'YYYY-MM-DD'
    toDate = '',
    page = 0,
    size = 20,
} = {}) => {
    const params = { page, size };
    if (keyword) params.keyword = keyword;
    if (active !== '') params.active = active;
    if (provider) params.provider = provider;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const res = await axios.get(`${BASE}/customers`, { params });
    return res.data;
};

/**
 * Lấy chi tiết 1 khách hàng (kèm order stats, membership tier).
 * @param {string} userId
 * @returns {Promise<UserDetailResponse>}
 */
export const getCustomerDetail = async (userId) => {
    const res = await axios.get(`${BASE}/customers/${userId}`);
    return res.data;
};

// ════════════════════════════════════════════════════════
// STAFF
// ════════════════════════════════════════════════════════

/**
 * Lấy danh sách nhân viên (STAFF + ADMIN) có phân trang.
 * @param {string} [params.role] - 'STAFF' | 'ADMIN' | '' (tất cả)
 * @returns {Promise<PagedResponse<UserDetailResponse>>}
 */
export const getStaff = async ({
    keyword = '',
    role = '',
    active = '',
    page = 0,
    size = 20,
} = {}) => {
    const params = { page, size };
    if (keyword) params.keyword = keyword;
    if (role) params.role = role;
    if (active !== '') params.active = active;

    const res = await axios.get(`${BASE}/staff`, { params });
    return res.data;
};

/**
 * Admin tạo tài khoản nhân viên mới.
 * @param {CreateStaffPayload} payload
 * @returns {Promise<UserDetailResponse>}
 */
export const createStaff = async (payload) => {
    const res = await axios.post(`${BASE}/staff`, payload);
    return res.data;
};

/**
 * Admin cập nhật thông tin nhân viên.
 * @param {string} userId
 * @param {UpdateStaffPayload} payload
 * @returns {Promise<UserDetailResponse>}
 */
export const updateStaff = async (userId, payload) => {
    const res = await axios.put(`${BASE}/staff/${userId}`, payload);
    return res.data;
};

/**
 * Xóa mềm nhân viên (active = false).
 * @param {string} userId
 */
export const softDeleteStaff = async (userId) => {
    await axios.delete(`${BASE}/staff/${userId}`);
};

// ════════════════════════════════════════════════════════
// SHARED — STATUS, ROLE, ADDRESSES
// ════════════════════════════════════════════════════════

/**
 * Bật hoặc tắt tài khoản người dùng (khách hàng hoặc nhân viên).
 * @param {string} userId
 * @param {boolean} active
 * @param {string} [reason]
 * @returns {Promise<UserDetailResponse>}
 */
export const updateUserStatus = async (userId, active, reason = '') => {
    const res = await axios.patch(`${BASE}/users/${userId}/status`, { active, reason });
    return res.data;
};

/**
 * Gán role mới cho người dùng.
 * @param {string} userId
 * @param {string} role - 'USER' | 'STAFF' | 'ADMIN' (không được là 'SUPER_ADMIN')
 * @returns {Promise<UserDetailResponse>}
 */
export const assignRole = async (userId, role) => {
    const res = await axios.patch(`${BASE}/users/${userId}/role`, { role });
    return res.data;
};

/**
 * Lấy toàn bộ sổ địa chỉ của 1 người dùng theo userId.
 * Dùng cho Admin xem địa chỉ của khách hàng hoặc nhân viên.
 *
 * Endpoint: GET /api/v1/management/users/{userId}/addresses
 *
 * @param {string} userId
 * @returns {Promise<AddressResponse[]>}
 */
export const getUserAddresses = async (userId) => {
    const res = await axios.get(`${BASE}/users/${userId}/addresses`);
    // Backend trả về ApiResponse<List<AddressResponse>> → unwrap result
    return res.data?.result ?? res.data ?? [];
};