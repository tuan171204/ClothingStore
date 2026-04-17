'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, ShoppingCart, Users, Package,
    AlertTriangle, ArrowUpRight, ArrowDownRight,
    Calendar, RefreshCw, BarChart2, Star,
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
    getDashboardSummary,
    getMonthlyRevenue,
    getRevenueByCategory,
    getBestSellers,
    getTopCustomers,
    getOrderSummaryReport,
} from '@/services/reportService';

// ── Helpers ─────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const fmtShort = (n) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}T`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n ?? 0);
};

const today = new Date();
const thisYear = today.getFullYear();
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthStart = isoDate(new Date(thisYear, today.getMonth(), 1));
const monthEnd = isoDate(today);

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

// ── KPI Card ────────────────────────────────────────────────
function KpiCard({ label, value, sub, growth, icon: Icon, color }) {
    const up = growth != null && growth >= 0;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
                {growth != null && (
                    <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full
                        ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(growth).toFixed(1)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
            <p className="text-md font-semibold text-gray-500 mt-0.5">{label}</p>
            {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

// ── Custom tooltip ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-sm">
            <p className="font-bold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-semibold">
                    {p.name}: {typeof p.value === 'number' && p.value > 1000
                        ? fmt(p.value) : p.value}
                </p>
            ))}
        </div>
    );
}

// ── Section wrapper ─────────────────────────────────────────
function Section({ title, children, action }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-800 text-md">{title}</h3>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────
export default function DashboardPage() {
    const [summary, setSummary] = useState(null);
    const [monthly, setMonthly] = useState([]);
    const [byCategory, setByCategory] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [orderStats, setOrderStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(thisYear);

    const load = async () => {
        setLoading(true);
        try {
            const [sum, mon, cat, best, cust, ord] = await Promise.all([
                getDashboardSummary(),
                getMonthlyRevenue(year),
                getRevenueByCategory(monthStart, monthEnd),
                getBestSellers(monthStart, monthEnd, 5),
                getTopCustomers(monthStart, monthEnd, 5),
                getOrderSummaryReport(monthStart, monthEnd),
            ]);
            setSummary(sum);
            setMonthly(mon ?? []);
            setByCategory(cat ?? []);
            setBestSellers(best ?? []);
            setTopCustomers(cust ?? []);
            setOrderStats(ord);
        } catch (e) {
            console.error('Dashboard load error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [year]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <RefreshCw size={28} className="animate-spin text-blue-500" />
        </div>
    );

    const s = summary ?? {};

    // Format monthly data for chart
    const monthlyChartData = (monthly ?? []).map(d => ({
        period: d.period ?? '',
        'Doanh thu': Number(d.revenue ?? 0),
        'Đơn hàng': Number(d.orderCount ?? 0),
    }));

    // Order status pie data
    const orderPieData = (orderStats?.byStatus ?? []).map(s => ({
        name: s.status,
        value: Number(s.count ?? 0),
    }));

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
                    <p className="text-md text-gray-500 mt-0.5">Tổng quan hoạt động kinh doanh</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-md font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-md font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw size={14} /> Làm mới
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Doanh thu hôm nay" value={fmtShort(s.revenueToday)}
                    icon={TrendingUp} color="bg-blue-500"
                    growth={s.revenueGrowthMonth} sub="so với tháng trước" />
                <KpiCard label="Doanh thu tháng" value={fmtShort(s.revenueThisMonth)}
                    icon={BarChart2} color="bg-violet-500"
                    growth={s.revenueGrowthMonth} />
                <KpiCard label="Đơn hàng hôm nay" value={s.ordersToday ?? 0}
                    icon={ShoppingCart} color="bg-emerald-500"
                    growth={s.orderGrowthMonth} />
                <KpiCard label="KH mới tháng này" value={s.newCustomersThisMonth ?? 0}
                    icon={Users} color="bg-pink-500" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Doanh thu năm" value={fmtShort(s.revenueThisYear)}
                    icon={TrendingUp} color="bg-amber-500" />
                <KpiCard label="Đơn hàng tháng" value={s.ordersThisMonth ?? 0}
                    icon={ShoppingCart} color="bg-cyan-500" />
                <KpiCard label="Sắp hết hàng" value={s.lowStockCount ?? 0}
                    icon={AlertTriangle} color="bg-orange-500" />
                <KpiCard label="Hết hàng" value={s.outOfStockCount ?? 0}
                    icon={Package} color="bg-red-500" />
            </div>

            {/* ── Revenue Line Chart ── */}
            <Section
                title={`Doanh thu theo tháng — ${year}`}
                action={
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Calendar size={12} /> Năm {year}
                    </span>
                }
            >
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyChartData}>
                        <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="Doanh thu" stroke="#3b82f6"
                            strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#3b82f6' }} />
                    </AreaChart>
                </ResponsiveContainer>
            </Section>

            {/* ── Row: Category Pie + Order Stats ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Doanh thu theo danh mục (tháng này)">
                    {byCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={byCategory} dataKey="revenue" nameKey="categoryName"
                                    cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                                    {byCategory.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => fmt(v)} />
                                <Legend iconType="circle" iconSize={10}
                                    formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-md text-gray-400 text-center py-10">Chưa có dữ liệu</p>
                    )}
                </Section>

                <Section title="Trạng thái đơn hàng (tháng này)">
                    {orderPieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={orderPieData} layout="vertical" barSize={14}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {orderPieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                {[
                                    { l: 'Tổng đơn', v: orderStats?.totalOrders ?? 0 },
                                    { l: 'Tỷ lệ chuyển đổi', v: `${orderStats?.conversionRate ?? 0}%` },
                                    { l: 'AOV', v: fmtShort(orderStats?.averageOrderValue) },
                                ].map(({ l, v }) => (
                                    <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-lg font-black text-gray-900">{v}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">{l}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-md text-gray-400 text-center py-10">Chưa có dữ liệu</p>
                    )}
                </Section>
            </div>

            {/* ── Row: Best Sellers + Top Customers ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="🏆 Top sản phẩm bán chạy (tháng này)">
                    <div className="space-y-3">
                        {bestSellers.length > 0 ? bestSellers.map((p, i) => (
                            <div key={p.productId}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                                <span className={`text-md font-black w-6 text-center ${i === 0 ? 'text-amber-500' :
                                        i === 1 ? 'text-gray-400' :
                                            i === 2 ? 'text-orange-600' : 'text-gray-300'
                                    }`}>#{i + 1}</span>
                                <img src={p.thumbnail || 'https://placehold.co/40?text=?'}
                                    alt={p.productName}
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-md font-semibold text-gray-800 truncate">{p.productName}</p>
                                    <p className="text-sm text-gray-400">Đã bán: <strong>{p.quantitySold}</strong> · Còn: {p.currentStock}</p>
                                </div>
                                <p className="text-md font-bold text-blue-600 shrink-0">{fmtShort(p.revenue)}</p>
                            </div>
                        )) : <p className="text-md text-gray-400 text-center py-6">Chưa có dữ liệu</p>}
                    </div>
                </Section>

                <Section title="👑 Top khách hàng (tháng này)">
                    <div className="space-y-3">
                        {topCustomers.length > 0 ? topCustomers.map((c, i) => (
                            <div key={c.userId}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500
                                    flex items-center justify-center text-white text-md font-bold shrink-0">
                                    {(c.fullName ?? 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-md font-semibold text-gray-800 truncate">{c.fullName}</p>
                                    <p className="text-sm text-gray-400">{c.email} · {c.totalOrders} đơn</p>
                                </div>
                                <p className="text-md font-bold text-emerald-600 shrink-0">{fmtShort(c.totalSpent)}</p>
                            </div>
                        )) : <p className="text-md text-gray-400 text-center py-6">Chưa có dữ liệu</p>}
                    </div>
                </Section>
            </div>

            {/* ── Last 30 days mini trend ── */}
            {s.last30DaysRevenue?.length > 0 && (
                <Section title="📈 Xu hướng 30 ngày gần nhất">
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={(s.last30DaysRevenue ?? []).map(d => ({
                            period: d.period?.slice(5), // MM-DD
                            revenue: Number(d.revenue ?? 0),
                        }))}>
                            <defs>
                                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} interval={4} />
                            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981"
                                strokeWidth={2} fill="url(#trendGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Section>
            )}
        </div>
    );
}