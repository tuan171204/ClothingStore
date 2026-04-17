import axios from '@/lib/axios';

const BASE = '/management';

// ── CUSTOMERS ──────────────────────────────────────────────
export const getCustomers = async ({
    keyword = '',
    active = '',
    provider = '',
    fromDate = '',
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

export const getCustomerDetail = async (userId) => {
    const res = await axios.get(`${BASE}/customers/${userId}`);
    return res.data;
};

// ── STAFF ──────────────────────────────────────────────────
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

export const createStaff = async (payload) => {
    const res = await axios.post(`${BASE}/staff`, payload);
    return res.data;
};

export const updateStaff = async (userId, payload) => {
    const res = await axios.put(`${BASE}/staff/${userId}`, payload);
    return res.data;
};

export const softDeleteStaff = async (userId) => {
    await axios.delete(`${BASE}/staff/${userId}`);
};

// ── SHARED ─────────────────────────────────────────────────
export const updateUserStatus = async (userId, active, reason = '') => {
    const res = await axios.patch(`${BASE}/users/${userId}/status`, { active, reason });
    return res.data;
};

export const assignRole = async (userId, role) => {
    const res = await axios.patch(`${BASE}/users/${userId}/role`, { role });
    return res.data;
};