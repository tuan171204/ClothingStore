'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, TrendingUp, TrendingDown, PackageSearch } from 'lucide-react';
import { getProductPerformance } from '@/services/reportService';
// Sửa lại tên hàm import cho đúng với file service của bạn
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, ComposedChart, Line
} from 'recharts';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);
const fmtShort = (n) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}T`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n ?? 0);
};

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthStart = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
const monthEnd = isoDate(today);

// ── Component Custom Tooltip cho Chart ──
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-sm">
            <p className="font-bold text-gray-700 mb-2 border-b pb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-semibold flex justify-between gap-4">
                    <span>{p.name}:</span>
                    <span>{p.name === 'Doanh thu' ? fmt(p.value) : p.value}</span>
                </p>
            ))}
        </div>
    );
}

// ── Component Biểu đồ ──
function PerformanceChart({ data, type }) {
    if (!data || data.length === 0) return null;

    const chartData = data.map(item => ({
        name: item.productName,
        'Doanh thu': Number(item.revenue),
        'Số lượng': Number(item.quantitySold)
    }));

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center gap-2">
                {type === 'TOP' ? <TrendingUp size={18} className="text-emerald-500" /> : <TrendingDown size={18} className="text-rose-500" />}
                Trực quan hóa hiệu suất sản phẩm
            </h3>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            height={60}
                        />
                        {/* Trục Doanh thu (Trái) */}
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#3b82f6"
                            tickFormatter={fmtShort}
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        {/* Trục Số lượng (Phải) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#10b981"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Legend verticalAlign="top" align="right" height={36} />

                        <Bar yAxisId="left" dataKey="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                        <Line yAxisId="right" type="monotone" dataKey="Số lượng" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ── Component Trang Chính ──
export default function ProductPerformancePage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dữ liệu cho bộ lọc
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Trạng thái bộ lọc
    const [filters, setFilters] = useState({
        from: monthStart,
        to: monthEnd,
        categoryId: '',
        brandId: '',
        type: 'TOP',
        limit: 10
    });

    useEffect(() => {
        // Tải danh sách Categories và Brands
        const loadFiltersData = async () => {
            try {
                // Đã sửa tên hàm ở đây
                const [cats, brds] = await Promise.all([
                    getCategories(),
                    getBrands()
                ]);
                setCategories(Array.isArray(cats) ? cats : cats.data || []);
                setBrands(Array.isArray(brds) ? brds : brds.data || []);
            } catch (error) {
                console.error("Lỗi tải bộ lọc:", error);
            }
        };
        loadFiltersData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await getProductPerformance(
                filters.from,
                filters.to,
                filters.categoryId || null,
                filters.brandId || null,
                filters.type,
                filters.limit
            );
            setData(result || []);
        } catch (error) {
            console.error("Lỗi tải báo cáo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Hiệu suất sản phẩm</h1>
                <p className="text-md text-gray-500 mt-0.5">Phân tích Top sản phẩm bán chạy / bán chậm</p>
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-end gap-4 relative z-20">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                    <label className="text-sm font-semibold text-gray-600">Từ ngày</label>
                    <input type="date" name="from" value={filters.from} onChange={handleFilterChange}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                    <label className="text-sm font-semibold text-gray-600">Đến ngày</label>
                    <input type="date" name="to" value={filters.to} onChange={handleFilterChange}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                    <label className="text-sm font-semibold text-gray-600">Danh mục</label>
                    <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                        <option value="">Tất cả danh mục</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                    <label className="text-sm font-semibold text-gray-600">Thương hiệu</label>
                    <select name="brandId" value={filters.brandId} onChange={handleFilterChange}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                        <option value="">Tất cả thương hiệu</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                    <label className="text-sm font-semibold text-gray-600">Loại báo cáo</label>
                    <select name="type" value={filters.type} onChange={handleFilterChange}
                        className={`border rounded-lg px-3 py-2 text-sm outline-none font-bold
                            ${filters.type === 'TOP' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-rose-600 border-rose-200 bg-rose-50'}`}>
                        <option value="TOP">🔥 Bán chạy (Top)</option>
                        <option value="BOTTOM">❄️ Bán chậm (Bottom)</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-[0.5] min-w-[80px]">
                    <label className="text-sm font-semibold text-gray-600">Số lượng</label>
                    <select name="limit" value={filters.limit} onChange={handleFilterChange}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
            </div>

            {/* ── Biểu đồ trực quan ── */}
            {!loading && data.length > 0 && (
                <PerformanceChart data={data} type={filters.type} />
            )}

            {/* ── Data Table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                                <th className="px-5 py-4 font-semibold w-16 text-center">Hạng</th>
                                <th className="px-5 py-4 font-semibold">Sản phẩm</th>
                                <th className="px-5 py-4 font-semibold text-right">Số lượng bán</th>
                                <th className="px-5 py-4 font-semibold text-right">Doanh thu mang lại</th>
                                <th className="px-5 py-4 font-semibold text-right">Tồn kho hiện tại</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-12 text-center text-gray-400">
                                        <PackageSearch size={40} className="mx-auto mb-3 opacity-20" />
                                        Không có dữ liệu trong khoảng thời gian này
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                                ${filters.type === 'TOP'
                                                    ? (index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400')
                                                    : 'bg-rose-50 text-rose-500'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={item.thumbnail || 'https://placehold.co/40'} alt={item.productName}
                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                                                <span className="font-semibold text-gray-800 line-clamp-2">{item.productName}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold text-gray-900">
                                            {item.quantitySold}
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold text-blue-600">
                                            {fmt(item.revenue)}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`font-semibold ${item.currentStock > 10 ? 'text-gray-600' : 'text-red-500'}`}>
                                                {item.currentStock}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}