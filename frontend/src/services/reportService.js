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

export const getSalesTrend = async (from, to, groupBy = 'DAY') => {
    const res = await axios.get(`${BASE}/sales/trend`, { params: { from, to, groupBy } });
    return res.data;
};

export const exportSalesCsvUrl = (from, to, groupBy = 'DAY') => {
    return `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/sales/export?from=${from}&to=${to}&groupBy=${groupBy}`;
};

export const downloadSalesCsv = async (from, to, groupBy = 'DAY') => {
    const res = await axios.get(`${BASE}/sales/export`, {
        params: { from, to, groupBy },
        responseType: 'blob', // BẮT BUỘC: Để nhận dữ liệu file thay vì JSON
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;

    link.setAttribute('download', `sales-report-${from}-to-${to}.csv`);

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
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

export const getProductPerformance = async (from, to, categoryId, brandId, type = 'TOP', limit = 10) => {
    const params = { from, to, type, limit };
    if (categoryId) params.categoryId = categoryId;
    if (brandId) params.brandId = brandId;

    const res = await axios.get(`${BASE}/products/performance`, { params });
    return res.data;
};