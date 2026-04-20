'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    X, User, MapPin, ShoppingBag, Phone, Mail, Calendar,
    CreditCard, Package, ChevronLeft, ChevronRight, Clock,
    CheckCircle, XCircle, Truck, RotateCcw, AlertCircle,
    Star, TrendingUp, Award, Search, Filter, Eye, Ban,
    Home, CheckCircle2, ArrowLeft
} from 'lucide-react';
import axios from '@/lib/axios';
import Pagination from '@/components/admin/Pagination';

// ── Formatters ──────────────────────────────────────────────
const fmtVND = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : '—';

// ── Order Status Config ──────────────────────────────────────
const ORDER_STATUS = {
    PENDING: { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
    SHIPPING: { label: 'Đang giao', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Truck },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
    RETURN_REQUESTED: { label: 'Yêu cầu hoàn', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: RotateCcw },
    RETURNED: { label: 'Đã hoàn trả', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: RotateCcw },
};

function OrderStatusBadge({ status }) {
    const cfg = ORDER_STATUS[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertCircle };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold border ${cfg.color}`}>
            <Icon size={11} /> {cfg.label}
        </span>
    );
}

// ── Membership Tier ──────────────────────────────────────────
const TIER_CONFIG = {
    BRONZE: { label: 'Đồng', bg: 'from-amber-700 to-amber-500', icon: '🥉' },
    SILVER: { label: 'Bạc', bg: 'from-slate-500 to-slate-400', icon: '🥈' },
    GOLD: { label: 'Vàng', bg: 'from-yellow-500 to-amber-400', icon: '🥇' },
};

// ── Tab Button ───────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label, count }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-md font-semibold transition-all whitespace-nowrap
                ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <Icon size={15} />
            {label}
            {count != null && (
                <span className={`text-sm px-1.5 py-0.5 rounded-full font-bold
                    ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ── Profile Tab ──────────────────────────────────────────────
function ProfileTab({ user }) {
    const tier = user.membershipTier ? TIER_CONFIG[user.membershipTier] : null;

    return (
        <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide mb-1">Tổng đơn hàng</p>
                    <p className="text-2xl font-black text-blue-900">{user.totalOrders ?? 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">Chi tiêu</p>
                    <p className="text-lg font-black text-emerald-900">{fmtVND(user.totalSpent)}</p>
                </div>
                <div className={`rounded-2xl p-4 border ${tier ? `bg-gradient-to-br ${tier.bg} border-transparent` : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${tier ? 'text-white/80' : 'text-gray-500'}`}>Hạng thành viên</p>
                    <p className={`text-xl font-black ${tier ? 'text-white' : 'text-gray-400'}`}>
                        {tier ? `${tier.icon} ${tier.label}` : '—'}
                    </p>
                </div>
            </div>

            {/* Info grid */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-3.5 border-b bg-slate-50">
                    <h3 className="text-md font-bold text-slate-700 uppercase tracking-wide">Thông tin cá nhân</h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {[
                        { icon: User, label: 'Username', value: user.username },
                        { icon: Mail, label: 'Email', value: user.email },
                        { icon: Phone, label: 'Số điện thoại', value: user.phoneNumber ?? '—' },
                        { icon: Calendar, label: 'Ngày sinh', value: fmtDate(user.dob) },
                        { icon: Calendar, label: 'Đăng ký', value: fmtDate(user.createdAt) },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 px-5 py-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Icon size={14} className="text-slate-500" />
                            </div>
                            <span className="text-md text-slate-500 w-32 shrink-0">{label}</span>
                            <span className="text-md font-semibold text-slate-800 break-all">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Addresses Tab ─────────────────────────────────────────────
function AddressesTab({ userId }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const res = await axios.get(`/management/users/${userId}/addresses`);
                setAddresses(res.data?.result ?? res.data ?? []);
            } catch {
                setAddresses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, [userId]);

    if (loading) return (
        <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
    );

    if (!addresses.length) return (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Home size={32} className="mb-2 opacity-30" />
            <p className="text-md font-medium">Chưa có địa chỉ nào được lưu</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {addresses.map((addr) => (
                <div key={addr.id}
                    className={`rounded-2xl border p-4 transition-all ${addr.isDefault
                        ? 'border-blue-200 bg-blue-50/50'
                        : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                            ${addr.isDefault ? 'bg-blue-100' : 'bg-slate-100'}`}>
                            <MapPin size={16} className={addr.isDefault ? 'text-blue-600' : 'text-slate-500'} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-slate-800 text-md">{addr.receiverName}</p>
                                {addr.isDefault && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Mặc định
                                    </span>
                                )}
                            </div>
                            <p className="text-md text-slate-500">{addr.phone}</p>
                            <p className="text-md text-slate-600 mt-1">
                                {[addr.streetAddress, addr.wardName, addr.districtName, addr.provinceName]
                                    .filter(Boolean).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Order Item Detail (inline expand) ────────────────────────
function OrderDetailPanel({ order, onBack }) {
    return (
        <div className="space-y-4">
            {/* Back button */}
            <button onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group">
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                Quay lại danh sách
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-lg font-black text-slate-900">Đơn #{order.id}</span>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-slate-400">{fmtDateTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-slate-900">{fmtVND(order.totalAmount)}</p>
                        <span className={`text-sm px-2 py-0.5 rounded-lg font-semibold
                            ${order.paymentMethod === 'VNPAY' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {order.paymentMethod}
                        </span>
                    </div>
                </div>

                {/* Tracking */}
                {order.trackingCode && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-sm text-slate-500 mb-0.5">Mã vận đơn GHN</p>
                        <p className="font-mono font-bold text-indigo-600">{order.trackingCode}</p>
                        {order.trackingMessage && (
                            <p className="text-sm text-slate-500 mt-1 italic">"{order.trackingMessage}"</p>
                        )}
                    </div>
                )}
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Thông tin giao hàng</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-slate-400 text-xs mb-0.5">Người nhận</p>
                        <p className="font-semibold text-slate-800">{order.fullName}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs mb-0.5">SĐT</p>
                        <p className="font-semibold text-slate-800">{order.phoneNumber}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-slate-400 text-xs mb-0.5">Địa chỉ</p>
                        <p className="text-slate-700">{order.shippingAddress}</p>
                    </div>
                    {order.note && (
                        <div className="col-span-2">
                            <p className="text-slate-400 text-xs mb-0.5">Ghi chú</p>
                            <p className="text-slate-700 italic">"{order.note}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel info */}
            {order.status === 'CANCELLED' && order.cancelReason && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <p className="text-sm font-bold text-red-700 flex items-center gap-2 mb-1">
                        <Ban size={14} /> Lý do hủy đơn
                    </p>
                    <p className="text-sm text-red-600 italic">"{order.cancelReason}"</p>
                    {order.cancelledAt && (
                        <p className="text-xs text-red-400 mt-1">{fmtDateTime(order.cancelledAt)}</p>
                    )}
                </div>
            )}

            {/* Return info */}
            {(order.status === 'RETURN_REQUESTED' || order.status === 'RETURNED') && order.returnReason && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-bold text-orange-700 flex items-center gap-2">
                        <RotateCcw size={14} /> Thông tin hoàn trả
                    </p>
                    <p className="text-sm text-orange-800"><span className="font-semibold">Lý do:</span> {order.returnReason}</p>
                    {order.returnDescription && (
                        <p className="text-sm text-orange-800"><span className="font-semibold">Chi tiết:</span> {order.returnDescription}</p>
                    )}
                    {Array.isArray(order.returnImageUrls) && order.returnImageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {order.returnImageUrls.map((img, idx) => (
                                <a key={idx} href={img} target="_blank" rel="noreferrer"
                                    className="block w-16 h-16 rounded-xl overflow-hidden border border-orange-200">
                                    <img src={img} alt="Bằng chứng" className="w-full h-full object-cover" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Order items */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50">
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Sản phẩm đặt mua</p>
                </div>
                <div className="divide-y divide-slate-50">
                    {order.orderItems?.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-4 py-3">
                            <div className="min-w-0 flex-1 pr-4">
                                <p className="font-semibold text-slate-800 text-md truncate">{item.productName}</p>
                                <p className="text-sm text-slate-400">
                                    x{item.quantity} × {fmtVND(item.price ?? item.priceAtPurchase)}
                                </p>
                            </div>
                            <p className="font-bold text-blue-600 shrink-0">
                                {fmtVND(item.subtotal ?? (item.quantity * (item.price ?? item.priceAtPurchase ?? 0)))}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totals */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                    <span>Tạm tính</span>
                    <span className="font-semibold">{fmtVND(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-semibold">{fmtVND(order.shippingFee)}</span>
                </div>
                {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                        <span>Giảm giá {order.couponCode ? `(${order.couponCode})` : ''}</span>
                        <span className="font-semibold">-{fmtVND(order.discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-100">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600">{fmtVND(order.totalAmount)}</span>
                </div>
            </div>
        </div>
    );
}

// ── Orders Tab ───────────────────────────────────────────────
const ORDERS_PAGE_SIZE = 8;

function OrdersTab({ userId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null); // FIX: order detail view

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/orders/users/${userId}`);
            setOrders(res.data ?? []);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Reset page when filters change
    useEffect(() => { setPage(0); }, [search, statusFilter]);

    // Client-side filter + pagination
    const filtered = orders.filter(o => {
        const matchStatus = !statusFilter || o.status === statusFilter;
        const matchSearch = !search || (
            String(o.id).includes(search.trim()) ||
            (o.trackingCode ?? '').toLowerCase().includes(search.toLowerCase().trim()) ||
            (o.fullName ?? '').toLowerCase().includes(search.toLowerCase().trim())
        );
        return matchStatus && matchSearch;
    });

    const totalPages = Math.ceil(filtered.length / ORDERS_PAGE_SIZE);
    const sliced = filtered.slice(page * ORDERS_PAGE_SIZE, (page + 1) * ORDERS_PAGE_SIZE);

    // Show order detail
    if (selectedOrder) {
        return <OrderDetailPanel order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
    }

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[160px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Mã đơn, tên khách, mã vận đơn..."
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {search && (
                        <button onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            <X size={13} />
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-md font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
                >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(ORDER_STATUS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
            </div>

            {/* Stats chips */}
            {!loading && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full">
                        {filtered.length} đơn hàng{search || statusFilter ? ' (đã lọc)' : ''}
                    </span>
                    {orders.filter(o => o.status === 'COMPLETED').length > 0 && (
                        <span className="text-sm text-emerald-700 font-medium px-3 py-1 bg-emerald-50 rounded-full">
                            ✓ {orders.filter(o => o.status === 'COMPLETED').length} hoàn thành
                        </span>
                    )}
                    {orders.filter(o => o.status === 'CANCELLED').length > 0 && (
                        <span className="text-sm text-red-600 font-medium px-3 py-1 bg-red-50 rounded-full">
                            ✗ {orders.filter(o => o.status === 'CANCELLED').length} đã hủy
                        </span>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                </div>
            ) : !sliced.length ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <ShoppingBag size={32} className="mb-2 opacity-30" />
                    <p className="text-md font-medium">
                        {search || statusFilter ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {sliced.map(order => (
                            <div key={order.id}
                                className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-sm p-4 transition-all cursor-pointer group"
                                onClick={() => setSelectedOrder(order)}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            <span className="text-md font-bold text-slate-900">#{order.id}</span>
                                            <OrderStatusBadge status={order.status} />
                                            {order.trackingCode && (
                                                <span className="text-sm text-slate-400 font-mono">{order.trackingCode}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400">{fmtDateTime(order.createdAt)}</p>
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            <span className="text-sm text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                                                {order.paymentMethod}
                                            </span>
                                            <span className="text-sm text-slate-500">
                                                {order.orderItems?.length ?? 0} sản phẩm
                                            </span>
                                            {order.couponCode && (
                                                <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg font-medium">
                                                    🏷️ {order.couponCode}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-base font-black text-slate-900">{fmtVND(order.totalAmount)}</p>
                                        {order.discountAmount > 0 && (
                                            <p className="text-sm text-emerald-600 font-semibold">-{fmtVND(order.discountAmount)}</p>
                                        )}
                                        <p className="text-sm text-blue-500 font-semibold mt-1.5 flex items-center gap-1 justify-end
                                            group-hover:text-blue-700 transition-colors">
                                            <Eye size={12} /> Xem chi tiết
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FIX: Use Pagination component correctly */}
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        totalElements={filtered.length}
                        size={ORDERS_PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────
export default function CustomerDetailModal({ userId, onClose }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('profile');

    useEffect(() => {
        if (!userId) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/management/customers/${userId}`);
                setUser(res.data?.result ?? res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    if (!userId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
                    {loading ? (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 animate-pulse" />
                            <div className="space-y-2">
                                <div className="w-40 h-4 bg-white/10 rounded animate-pulse" />
                                <div className="w-24 h-3 bg-white/10 rounded animate-pulse" />
                            </div>
                        </div>
                    ) : user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-violet-500
                                    flex items-center justify-center text-white text-xl font-black shrink-0">
                                    {user.avatar
                                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                        : (user.fullName ?? 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-white font-black text-lg leading-tight">{user.fullName ?? user.username}</h2>
                                    <p className="text-white/50 text-md mt-0.5">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                        <span className="text-white/60 text-sm font-medium">
                                            {user.active ? 'Hoạt động' : 'Bị khóa'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose}
                                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X size={16} className="text-white" />
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Tabs */}
                <div className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-0 bg-slate-50/50">
                    <TabBtn active={tab === 'profile'} onClick={() => setTab('profile')} icon={User} label="Hồ sơ" />
                    <TabBtn active={tab === 'addresses'} onClick={() => setTab('addresses')} icon={MapPin} label="Địa chỉ" />
                    <TabBtn active={tab === 'orders'} onClick={() => setTab('orders')} icon={ShoppingBag} label="Đơn hàng"
                        count={user?.totalOrders} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                        </div>
                    ) : !user ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <AlertCircle size={32} className="mb-2 opacity-30" />
                            <p className="text-md">Không tìm thấy thông tin người dùng</p>
                        </div>
                    ) : (
                        <>
                            {tab === 'profile' && <ProfileTab user={user} />}
                            {tab === 'addresses' && <AddressesTab userId={userId} />}
                            {tab === 'orders' && <OrdersTab userId={userId} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}