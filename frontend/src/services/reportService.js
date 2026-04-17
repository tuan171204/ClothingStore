import axios from '@/lib/axios';

const BASE = '/reports';

// ── DASHBOARD ──────────────────────────────────────────────
export const getDashboardSummary = async () => {
    const res = await axios.get(`${BASE}/dashboard`);
    return res.data;
};

// ── REVENUE ────────────────────────────────────────────────
export const getDailyRevenue = async (from, to) => {
    const res = await axios.get(`${BASE}/revenue/daily`, { params: { from, to } });
    return res.data;
};

export const getMonthlyRevenue = async (year) => {
    const res = await axios.get(`${BASE}/revenue/monthly`, { params: { year } });
    return res.data;
};

export const getYearlyRevenue = async (fromYear) => {
    const res = await axios.get(`${BASE}/revenue/yearly`, { params: { fromYear } });
    return res.data;
};

export const getRevenueByProduct = async (from, to, topN = 10) => {
    const res = await axios.get(`${BASE}/revenue/by-product`, { params: { from, to, topN } });
    return res.data;
};

export const getRevenueByCategory = async (from, to) => {
    const res = await axios.get(`${BASE}/revenue/by-category`, { params: { from, to } });
    return res.data;
};

// ── ORDERS ─────────────────────────────────────────────────
export const getOrderSummaryReport = async (from, to) => {
    const res = await axios.get(`${BASE}/orders/summary`, { params: { from, to } });
    return res.data;
};

// ── CUSTOMERS ──────────────────────────────────────────────
export const getCustomerOverview = async (from, to) => {
    const res = await axios.get(`${BASE}/customers/overview`, { params: { from, to } });
    return res.data;
};

export const getTopCustomers = async (from, to, topN = 20) => {
    const res = await axios.get(`${BASE}/customers/top`, { params: { from, to, topN } });
    return res.data;
};

// ── PRODUCTS ───────────────────────────────────────────────
export const getBestSellers = async (from, to, topN = 10) => {
    const res = await axios.get(`${BASE}/products/best-sellers`, { params: { from, to, topN } });
    return res.data;
};