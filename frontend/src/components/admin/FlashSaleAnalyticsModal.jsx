'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    X, TrendingUp, Package, DollarSign, BarChart2,
    Trophy, Zap, ArrowUpRight, ArrowDownRight, Target,
    RefreshCw, Calendar, Clock, ShoppingCart
} from 'lucide-react';
import axios from '@/lib/axios';

// ── Formatters ──────────────────────────────────────────────
const fmtVND = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '₫0';

const fmtNum = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(n) : '0';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : '—';

// ── Mini Bar ─────────────────────────────────────────────────
function MiniBar({ value, max, color = 'bg-indigo-500' }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                style={{ width: `${pct}%` }} />
        </div>
    );
}

// ── Medal Badge ──────────────────────────────────────────────
function Medal({ rank }) {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-sm font-black flex items-center justify-center">{rank}</span>;
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gradient }) {
    return (
        <div className={`rounded-2xl p-4 ${gradient}`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold uppercase tracking-wide opacity-70">{label}</p>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon size={15} className="text-current opacity-80" />
                </div>
            </div>
            <p className="text-xl font-black leading-tight">{value}</p>
            {sub && <p className="text-sm mt-1 opacity-60 font-medium">{sub}</p>}
        </div>
    );
}

// ── Compute Analytics from FlashSale data ────────────────────
function computeAnalytics(sale) {
    if (!sale || !sale.items?.length) return null;

    const items = sale.items;

    // Total sold qty
    const totalSoldQty = items.reduce((s, i) => s + (i.soldQuantity ?? 0), 0);

    // Total revenue (sold * promotional price)
    const totalRevenue = items.reduce((s, i) =>
        s + (i.soldQuantity ?? 0) * Number(i.promotionalPrice ?? 0), 0);

    // Gross profit = (promotional - import) * sold
    // import price not always available; approximate as: revenue - (soldQty * importPrice)
    // Since we may not have import price in FlashSaleItem, compute margin vs original price
    const totalOriginalRevenue = items.reduce((s, i) =>
        s + (i.soldQuantity ?? 0) * Number(i.originalPrice ?? 0), 0);

    // Gross margin vs original price (discount given up)
    const discountGiven = totalOriginalRevenue - totalRevenue;
    const sellThrough = items.reduce((s, i) => s + (i.totalQuantity ?? 0), 0);
    const sellThroughRate = sellThrough > 0 ? (totalSoldQty / sellThrough) * 100 : 0;

    // Top items by sold quantity
    const topItems = [...items]
        .sort((a, b) => (b.soldQuantity ?? 0) - (a.soldQuantity ?? 0))
        .slice(0, 10);

    const maxSold = topItems[0]?.soldQuantity ?? 1;

    // Revenue per item
    const itemsWithRevenue = items.map(i => ({
        ...i,
        revenue: (i.soldQuantity ?? 0) * Number(i.promotionalPrice ?? 0),
        grossProfit: (i.soldQuantity ?? 0) * (Number(i.originalPrice ?? 0) - Number(i.promotionalPrice ?? 0)),
    }));

    // Total gross profit (opportunity cost framing — discount given to customers)
    // In a real scenario gross profit = revenue - COGS (import price)
    // We show: revenue, discount given, and note that import cost isn't available in this view
    const topByRevenue = [...itemsWithRevenue]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    return {
        totalSoldQty,
        totalRevenue,
        totalOriginalRevenue,
        discountGiven,
        sellThroughRate,
        sellThrough,
        topByQty: topItems,
        topByRevenue,
        maxSold,
        itemCount: items.length,
        status: sale.status,
    };
}

// ── Main Analytics Modal ─────────────────────────────────────
export default function FlashSaleAnalyticsModal({ saleId, onClose }) {
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rankBy, setRankBy] = useState('qty'); // 'qty' | 'revenue'

    useEffect(() => {
        if (!saleId) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/flash-sales/${saleId}`);
                setSale(res.data?.result ?? res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [saleId]);

    const analytics = useMemo(() => computeAnalytics(sale), [sale]);

    const topItems = rankBy === 'qty' ? analytics?.topByQty : analytics?.topByRevenue;
    const maxVal = rankBy === 'qty'
        ? analytics?.maxSold
        : (analytics?.topByRevenue?.[0]?.revenue ?? 1);

    const BAR_COLORS = [
        'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-sky-500',
        'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500',
        'bg-rose-500', 'bg-pink-500'
    ];

    if (!saleId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="shrink-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Zap size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-black text-lg leading-tight">
                                    Báo cáo Flash Sale
                                </h2>
                                {sale && (
                                    <p className="text-white/60 text-md mt-0.5">{sale.name}</p>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                            <X size={16} className="text-white" />
                        </button>
                    </div>

                    {/* Campaign info bar */}
                    {sale && (
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4">
                            <div className="flex items-center gap-1.5 text-white/70 text-sm">
                                <Calendar size={12} />
                                <span>Bắt đầu: <span className="text-white/90 font-semibold">{fmtDate(sale.startTime)}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-white/70 text-sm">
                                <Clock size={12} />
                                <span>Kết thúc: <span className="text-white/90 font-semibold">{fmtDate(sale.endTime)}</span></span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${sale.status === 'ACTIVE' ? 'bg-emerald-400/30 text-emerald-200' :
                                    sale.status === 'ENDED' ? 'bg-white/20 text-white/70' :
                                        'bg-amber-400/30 text-amber-200'}`}>
                                {sale.status}
                            </span>
                        </div>
                    )}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-60 gap-3">
                            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-md text-slate-400">Đang tải dữ liệu...</p>
                        </div>
                    ) : !analytics ? (
                        <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                            <BarChart2 size={40} className="mb-3 opacity-20" />
                            <p className="text-md font-medium">Không có dữ liệu báo cáo</p>
                        </div>
                    ) : (
                        <div className="p-5 space-y-5">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard
                                    icon={DollarSign}
                                    label="Doanh thu"
                                    value={fmtVND(analytics.totalRevenue)}
                                    sub={`Gốc: ${fmtVND(analytics.totalOriginalRevenue)}`}
                                    gradient="bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                                />
                                <StatCard
                                    icon={ShoppingCart}
                                    label="Sản phẩm bán"
                                    value={fmtNum(analytics.totalSoldQty)}
                                    sub={`/ ${fmtNum(analytics.sellThrough)} tổng`}
                                    gradient="bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                                />
                                <StatCard
                                    icon={Target}
                                    label="Sell-through"
                                    value={`${analytics.sellThroughRate.toFixed(1)}%`}
                                    sub={`${analytics.itemCount} SKU tham gia`}
                                    gradient="bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    label="Chiết khấu"
                                    value={fmtVND(analytics.discountGiven)}
                                    sub="So giá gốc"
                                    gradient="bg-gradient-to-br from-rose-500 to-pink-500 text-white"
                                />
                            </div>

                            {/* Gross profit note */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                                <TrendingUp size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-md font-bold text-amber-800">Lợi nhuận gộp</p>
                                    <p className="text-sm text-amber-700 mt-0.5">
                                        Lợi nhuận gộp chính xác = Doanh thu − Giá vốn (import price).
                                        Dữ liệu giá vốn theo từng SKU có trong bảng <code className="bg-amber-100 px-1 rounded">inventory / goods_receipt_items</code>.
                                        Doanh thu Flash Sale đạt <strong>{fmtVND(analytics.totalRevenue)}</strong>,
                                        chiết khấu so giá gốc là <strong>{fmtVND(analytics.discountGiven)}</strong>.
                                    </p>
                                </div>
                            </div>

                            {/* Leaderboard */}
                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <Trophy size={16} className="text-amber-500" />
                                        <h3 className="text-md font-bold text-slate-700">
                                            Top {Math.min(10, topItems?.length ?? 0)} sản phẩm bán chạy
                                        </h3>
                                    </div>
                                    {/* Toggle */}
                                    <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                                        <button onClick={() => setRankBy('qty')}
                                            className={`px-3 py-1 rounded-md text-sm font-bold transition-all
                                                ${rankBy === 'qty' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            Số lượng
                                        </button>
                                        <button onClick={() => setRankBy('revenue')}
                                            className={`px-3 py-1 rounded-md text-sm font-bold transition-all
                                                ${rankBy === 'revenue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            Doanh thu
                                        </button>
                                    </div>
                                </div>

                                {!topItems?.length ? (
                                    <div className="text-center py-10 text-slate-400 text-md">
                                        Chưa có sản phẩm nào được bán
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {topItems.map((item, idx) => {
                                            const val = rankBy === 'qty'
                                                ? (item.soldQuantity ?? 0)
                                                : ((item.soldQuantity ?? 0) * Number(item.promotionalPrice ?? 0));
                                            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

                                            return (
                                                <div key={item.id ?? item.skuId}
                                                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">

                                                    {/* Rank */}
                                                    <div className="w-8 flex items-center justify-center shrink-0">
                                                        <Medal rank={idx + 1} />
                                                    </div>

                                                    {/* Thumbnail */}
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                                        {item.thumbnailUrl ? (
                                                            <img src={item.thumbnailUrl} alt=""
                                                                className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package size={16} className="text-slate-300" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-md font-bold text-slate-800 truncate">
                                                            {item.productName}
                                                        </p>
                                                        <p className="text-sm text-slate-400 truncate">
                                                            {item.variantName} · {item.skuCode}
                                                        </p>
                                                        <div className="mt-1.5">
                                                            <MiniBar
                                                                value={val}
                                                                max={maxVal}
                                                                color={BAR_COLORS[idx % BAR_COLORS.length]}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Value */}
                                                    <div className="text-right shrink-0 ml-2">
                                                        <p className="text-md font-black text-slate-900">
                                                            {rankBy === 'qty'
                                                                ? `${fmtNum(item.soldQuantity ?? 0)} sp`
                                                                : fmtVND(val)}
                                                        </p>
                                                        <p className="text-sm text-slate-400">
                                                            {rankBy === 'qty'
                                                                ? fmtVND((item.soldQuantity ?? 0) * Number(item.promotionalPrice ?? 0))
                                                                : `${fmtNum(item.soldQuantity ?? 0)} sp`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* All items summary table */}
                            {sale?.items?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                    <div className="px-5 py-3.5 border-b bg-slate-50">
                                        <h3 className="text-md font-bold text-slate-700">Tổng hợp tất cả SKU</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-md">
                                            <thead>
                                                <tr className="border-b border-slate-50">
                                                    <th className="text-left px-4 py-2.5 text-sm font-bold text-slate-400 uppercase">Sản phẩm</th>
                                                    <th className="text-right px-4 py-2.5 text-sm font-bold text-slate-400 uppercase">Giá KM</th>
                                                    <th className="text-right px-4 py-2.5 text-sm font-bold text-slate-400 uppercase">Đã bán</th>
                                                    <th className="text-right px-4 py-2.5 text-sm font-bold text-slate-400 uppercase">Còn lại</th>
                                                    <th className="text-right px-4 py-2.5 text-sm font-bold text-slate-400 uppercase hidden sm:table-cell">Doanh thu</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {sale.items.map(item => {
                                                    const rev = (item.soldQuantity ?? 0) * Number(item.promotionalPrice ?? 0);
                                                    const stRate = item.totalQuantity > 0
                                                        ? ((item.soldQuantity ?? 0) / item.totalQuantity * 100).toFixed(0)
                                                        : 0;
                                                    return (
                                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                                            <td className="px-4 py-2.5">
                                                                <p className="font-semibold text-slate-800 text-sm truncate max-w-40">{item.productName}</p>
                                                                <p className="text-sm text-slate-400">{item.variantName}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right">
                                                                <p className="font-bold text-indigo-600 text-sm">{fmtVND(item.promotionalPrice)}</p>
                                                                <p className="text-sm text-slate-400 line-through">{fmtVND(item.originalPrice)}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right">
                                                                <p className="font-bold text-slate-800 text-sm">{fmtNum(item.soldQuantity)}</p>
                                                                <p className="text-sm text-slate-400">{stRate}% sell-through</p>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right">
                                                                <span className={`text-sm font-bold px-2 py-0.5 rounded-full
                                                                    ${(item.remainingQuantity ?? 0) === 0
                                                                        ? 'bg-red-50 text-red-600'
                                                                        : 'bg-emerald-50 text-emerald-700'}`}>
                                                                    {fmtNum(item.remainingQuantity)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-bold text-slate-700 text-sm hidden sm:table-cell">
                                                                {fmtVND(rev)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-slate-200 bg-slate-50">
                                                    <td className="px-4 py-3 font-black text-slate-800 text-sm" colSpan={2}>TỔNG CỘNG</td>
                                                    <td className="px-4 py-3 text-right font-black text-slate-800 text-sm">
                                                        {fmtNum(analytics.totalSoldQty)} sp
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-slate-800 text-sm">
                                                        {fmtNum(analytics.sellThrough - analytics.totalSoldQty)} sp
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-indigo-700 text-sm hidden sm:table-cell">
                                                        {fmtVND(analytics.totalRevenue)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}