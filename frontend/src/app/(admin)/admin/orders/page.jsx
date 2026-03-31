'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    Search, Filter, X, ChevronLeft, ChevronRight,
    Truck, CheckCircle, Eye, RefreshCw,
    TrendingUp, ShoppingBag, Clock, Ban,
    CalendarDays, CreditCard, Hash,
} from 'lucide-react';
import {
    getOrdersFiltered,
    getOrderSummary,
    updateOrderStatus,
    shipOrder,
} from '@/services/orderService';

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái', color: 'bg-gray-100 text-gray-700' },
    { value: 'PENDING', label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
    { value: 'SHIPPING', label: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
];

// Chỉ cho phép chuyển theo các bước hợp lệ
// - PENDING → CONFIRMED hoặc CANCELLED  (Nút xác nhận hoặc hủy)
// - CONFIRMED → SHIPPING (qua GHN) hoặc CANCELLED
// - SHIPPING → COMPLETED hoặc CANCELLED
const STATUS_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['CANCELLED'],     // SHIPPING chỉ qua nút GHN riêng
    SHIPPING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
};

const PAYMENT_OPTIONS = [
    { value: '', label: 'Tất cả thanh toán' },
    { value: 'COD', label: 'COD (Tiền mặt)' },
    { value: 'VNPAY', label: 'VNPay' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0);

const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }) : '—';

const StatusBadge = ({ status }) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${opt?.color ?? 'bg-gray-100 text-gray-600'}`}>
            {opt?.label ?? status}
        </span>
    );
};

// ── DETAIL MODAL ──────────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose, onStatusChange, onShip }) => {
    if (!order) return null;
    const nextStatuses = STATUS_TRANSITIONS[order.status] ?? [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Chi tiết đơn #{order.id}</h2>
                        <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Trạng thái + Hành động */}
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={order.status} />

                        {/* Nút chuyển trạng thái phụ (hủy, hoàn thành...) */}
                        {nextStatuses.map(s => {
                            const opt = STATUS_OPTIONS.find(o => o.value === s);
                            const isCancel = s === 'CANCELLED';
                            return (
                                <button key={s}
                                    onClick={() => onStatusChange(order.id, s)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${isCancel
                                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}>
                                    → {opt?.label}
                                </button>
                            );
                        })}

                        {/* Nút Duyệt & Giao GHN — CHỈ hiện khi status là CONFIRMED */}
                        {order.status === 'CONFIRMED' && (
                            <button
                                onClick={() => onShip(order.id)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm">
                                <Truck size={15} /> Duyệt & Giao GHN
                            </button>
                        )}
                    </div>

                    {/* Thông tin khách */}
                    <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                        <div>
                            <p className="text-gray-400 text-xs mb-0.5 uppercase font-medium">Khách hàng</p>
                            <p className="font-semibold text-gray-800">{order.fullName}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-0.5 uppercase font-medium">Số điện thoại</p>
                            <p className="font-semibold text-gray-800">{order.phoneNumber}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-400 text-xs mb-0.5 uppercase font-medium">Địa chỉ giao hàng</p>
                            <p className="text-gray-700">{order.shippingAddress}</p>
                        </div>
                        {order.trackingCode && (
                            <div className="col-span-2">
                                <p className="text-gray-400 text-xs mb-0.5 uppercase font-medium">Mã vận đơn GHN</p>
                                <p className="font-mono font-bold text-indigo-600">{order.trackingCode}</p>
                            </div>
                        )}
                        {order.note && (
                            <div className="col-span-2">
                                <p className="text-gray-400 text-xs mb-0.5 uppercase font-medium">Ghi chú</p>
                                <p className="text-gray-700 italic">"{order.note}"</p>
                            </div>
                        )}
                    </div>

                    {/* Sản phẩm */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Sản phẩm đặt mua</p>
                        <div className="divide-y border rounded-xl overflow-hidden">
                            {order.orderItems?.map(item => (
                                <div key={item.id} className="flex justify-between items-center px-4 py-3 text-sm hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.productName}</p>
                                        <p className="text-gray-400 text-xs">x{item.quantity} × {formatCurrency(item.price)}</p>
                                    </div>
                                    <p className="font-bold text-blue-600">{formatCurrency(item.subtotal)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tổng tiền */}
                    <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                        <div className="flex justify-between text-gray-500">
                            <span>Tiền hàng</span>
                            <span>{formatCurrency(order.totalAmount - order.shippingFee)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Phí vận chuyển</span>
                            <span>{formatCurrency(order.shippingFee)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-800 text-base border-t pt-2">
                            <span>Tổng thanh toán</span>
                            <span className="text-blue-600">{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Phương thức</span>
                            <span className={`font-semibold ${order.paymentMethod === 'VNPAY' ? 'text-blue-600' : 'text-gray-700'}`}>
                                {order.paymentMethod}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── MAIN PAGE ────────────────────────────────────────────────────
export default function AdminOrderPage() {
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [orders, setOrders] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const debounceTimer = useRef(null);

    const buildParams = useCallback(() => {
        const p = { page, size: pageSize };
        if (keyword.trim()) p.keyword = keyword.trim();
        if (status) p.status = status;
        if (paymentMethod) p.paymentMethod = paymentMethod;
        if (fromDate) p.fromDate = new Date(fromDate).toISOString();
        if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); p.toDate = end.toISOString(); }
        return p;
    }, [keyword, status, paymentMethod, fromDate, toDate, page, pageSize]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = buildParams();
            const [paged, sum] = await Promise.all([getOrdersFiltered(params), getOrderSummary(params)]);
            setOrders(paged.content ?? []);
            setTotalPages(paged.totalPages ?? 0);
            setTotalElements(paged.totalElements ?? 0);
            setSummary(sum);
        } catch {
            toast.error('Không tải được dữ liệu đơn hàng');
        } finally { setLoading(false); }
    }, [buildParams]);

    useEffect(() => { setPage(0); }, [keyword, status, paymentMethod, fromDate, toDate, pageSize]);

    useEffect(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(fetchData, 350);
        return () => clearTimeout(debounceTimer.current);
    }, [fetchData]);

    const handleStatusChange = async (orderId, newStatus) => {
        const label = STATUS_OPTIONS.find(s => s.value === newStatus)?.label;
        if (!window.confirm(`Xác nhận chuyển sang "${label}"?`)) return;
        try {
            await updateOrderStatus(orderId, newStatus);
            toast.success('Đã cập nhật trạng thái!');
            setSelectedOrder(null);
            fetchData();
        } catch { toast.error('Cập nhật thất bại!'); }
    };

    const handleShip = async (orderId) => {
        if (!window.confirm('Tạo vận đơn GHN và chuyển sang Đang giao?')) return;
        try {
            toast.info('Đang kết nối GHN...');
            await shipOrder(orderId);
            toast.success('Tạo vận đơn thành công!');
            setSelectedOrder(null);
            fetchData();
        } catch (err) {
            toast.error('❌ ' + (err.response?.data?.message || err.message));
        }
    };

    const clearFilters = () => { setKeyword(''); setStatus(''); setPaymentMethod(''); setFromDate(''); setToDate(''); setPage(0); };
    const hasActiveFilter = keyword || status || paymentMethod || fromDate || toDate;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Tìm kiếm, lọc và xử lý toàn bộ đơn hàng</p>
                    </div>
                    <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard icon={<ShoppingBag size={22} className="text-blue-500" />} label="Tổng đơn" value={totalElements} bg="bg-blue-50" />
                    <SummaryCard icon={<TrendingUp size={22} className="text-green-500" />} label="Doanh thu" value={formatCurrency(summary.totalRevenue)} bg="bg-green-50" small />
                    <SummaryCard icon={<Clock size={22} className="text-yellow-500" />} label="Chờ xử lý" value={orders.filter(o => o.status === 'PENDING').length} bg="bg-yellow-50" suffix="/ trang" />
                    <SummaryCard icon={<Ban size={22} className="text-red-400" />} label="Đã hủy" value={orders.filter(o => o.status === 'CANCELLED').length} bg="bg-red-50" suffix="/ trang" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Mã đơn, tên khách, SĐT, mã vận đơn..." value={keyword} onChange={e => setKeyword(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            {keyword && <button onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={15} /></button>}
                        </div>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer">
                            {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer w-32">
                            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / trang</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                        <div className="flex flex-wrap gap-1.5 flex-1">
                            {STATUS_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setStatus(opt.value === status ? '' : opt.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer border ${status === opt.value ? `${opt.color} border-transparent ring-2 ring-offset-1 ring-blue-400` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <CalendarDays size={15} className="text-gray-400" />
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer" />
                            <span className="text-gray-400 text-sm">→</span>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer" />
                        </div>
                    </div>

                    {hasActiveFilter && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                            <Filter size={13} className="text-gray-400" />
                            <span className="text-sm text-gray-500">Đang lọc:</span>
                            {keyword && <FilterChip label={`"${keyword}"`} onRemove={() => setKeyword('')} />}
                            {status && <FilterChip label={STATUS_OPTIONS.find(s => s.value === status)?.label} onRemove={() => setStatus('')} />}
                            {paymentMethod && <FilterChip label={paymentMethod} onRemove={() => setPaymentMethod('')} />}
                            {fromDate && <FilterChip label={`Từ ${fromDate}`} onRemove={() => setFromDate('')} />}
                            {toDate && <FilterChip label={`Đến ${toDate}`} onRemove={() => setToDate('')} />}
                            <button onClick={clearFilters} className="ml-auto text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer">
                                <X size={12} /> Xóa tất cả
                            </button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><Hash size={12} /> Mã đơn</div></th>
                                    <th className="px-4 py-3 text-left">Khách hàng</th>
                                    <th className="px-4 py-3 text-right">Tổng tiền</th>
                                    <th className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><CreditCard size={12} /> Thanh toán</div></th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 text-left">Mã vận đơn</th>
                                    <th className="px-4 py-3 text-left">Ngày đặt</th>
                                    <th className="px-4 py-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={8} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <RefreshCw size={28} className="animate-spin text-blue-400" />
                                            <span>Đang tải dữ liệu...</span>
                                        </div>
                                    </td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={8} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <ShoppingBag size={40} className="text-gray-200" />
                                            <span>Không tìm thấy đơn hàng nào</span>
                                            {hasActiveFilter && <button onClick={clearFilters} className="text-blue-500 text-sm hover:underline cursor-pointer">Xóa bộ lọc</button>}
                                        </div>
                                    </td></tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3"><span className="font-mono font-bold text-gray-700">#{order.id}</span></td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800 leading-tight">{order.fullName}</p>
                                                <p className="text-gray-400 text-xs">{order.phoneNumber}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right"><span className="font-bold text-gray-800">{formatCurrency(order.totalAmount)}</span></td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${order.paymentMethod === 'VNPAY' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                    {order.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                                            <td className="px-4 py-3">
                                                {order.trackingCode
                                                    ? <span className="font-mono text-xs text-indigo-600 font-bold">{order.trackingCode}</span>
                                                    : <span className="text-gray-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Xem chi tiết */}
                                                    <button onClick={() => setSelectedOrder(order)} title="Xem chi tiết"
                                                        className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors cursor-pointer">
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Xác nhận đơn — CHỈ hiện khi PENDING */}
                                                    {order.status === 'PENDING' && (
                                                        <button onClick={() => handleStatusChange(order.id, 'CONFIRMED')} title="Xác nhận đơn hàng"
                                                            className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors cursor-pointer">
                                                            <CheckCircle size={15} />
                                                        </button>
                                                    )}

                                                    {/* Giao GHN — CHỈ hiện khi CONFIRMED */}
                                                    {order.status === 'CONFIRMED' && (
                                                        <button onClick={() => handleShip(order.id)} title="Duyệt & Giao GHN"
                                                            className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors cursor-pointer">
                                                            <Truck size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                            <p className="text-sm text-gray-500">
                                Hiển thị <span className="font-semibold text-gray-700">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)}</span> trong <span className="font-semibold text-gray-700">{totalElements}</span> đơn hàng
                            </p>
                            <div className="flex items-center gap-1">
                                <PaginationBtn onClick={() => setPage(0)} disabled={page === 0} label="«" />
                                <PaginationBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} label={<ChevronLeft size={16} />} />
                                {generatePageNumbers(page, totalPages).map((p, i) =>
                                    p === '...' ? <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
                                        : <PaginationBtn key={p} onClick={() => setPage(p)} active={p === page} label={p + 1} />
                                )}
                                <PaginationBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} label={<ChevronRight size={16} />} />
                                <PaginationBtn onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} label="»" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={handleStatusChange} onShip={handleShip} />
            )}
        </div>
    );
}

const SummaryCard = ({ icon, label, value, bg, small, suffix }) => (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3 border border-white shadow-sm`}>
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
            <p className="text-sm text-gray-500 leading-tight truncate">{label}</p>
            <p className={`font-bold text-gray-800 leading-tight ${small ? 'text-base' : 'text-xl'}`}>
                {value}{suffix && <span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span>}
            </p>
        </div>
    </div>
);

const FilterChip = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium">
        {label}
        <button onClick={onRemove} className="hover:text-blue-900 cursor-pointer"><X size={11} /></button>
    </span>
);

const PaginationBtn = ({ onClick, disabled, active, label }) => (
    <button onClick={onClick} disabled={disabled}
        className={`min-w-[34px] h-[34px] px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${active ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
        {label}
    </button>
);

function generatePageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages = new Set([0, total - 1, current]);
    for (let i = Math.max(0, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
        result.push(sorted[i]);
    }
    return result;
}