'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User, MapPin, Package, Camera, Save,
    LogOut, Loader2, Truck, XCircle, RotateCcw,
    Info,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getOrdersByUser } from '@/services/orderService';
import { addressService } from '@/services/addressService';
import { uploadUserAvatar } from '@/services/uploadService';
import { updateUserProfile } from '@/services/userService';
import Link from 'next/link';
import { formatCurrency } from '@/services/productService';
import { getReviewStatusByOrder } from '@/services/reviewService';
import OrderReviewModal from '@/components/shop/OrderReviewModal';
import CancelOrderModal from '@/components/shop/CancelOrderModal';
import ReturnOrderModal from '@/components/shop/ReturnOrderModal';
import DiscountInfo from '@/components/shop/DiscountInfo';
import { OrderPriceSummary } from '@/components/shop/OrderPriceSummary';

// ─── Mapping trạng thái đơn hàng ──────────────────────────────
const ORDER_STATUS_MAP = {
    PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    SHIPPING: { label: 'Đang giao hàng', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-green-50 text-green-700 border-green-200' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-200' },
    RETURN_REQUESTED: { label: 'Đang yêu cầu hoàn trả', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    RETURNED: { label: 'Đã hoàn trả', color: 'bg-gray-50 text-gray-700 border-gray-300' },
};

const ReviewStatusMap = {
    PENDING: 'Đang chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
};

const StatusBadge = ({ status }) => {
    const s = ORDER_STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
    return (
        <span className={`px-2.5 py-1 text-sm font-bold uppercase tracking-wider border rounded-full ${s.color}`}>
            {s.label}
        </span>
    );
};

export default function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'profile';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [orders, setOrders] = useState([]);
    const [orderReviewStatus, setOrderReviewStatus] = useState({});
    const [addresses, setAddresses] = useState([]);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Modal states
    const [reviewingOrderId, setReviewingOrderId] = useState(null);
    const [cancellingOrder, setCancellingOrder] = useState(null); // order object
    const [returningOrder, setReturningOrder] = useState(null); // order object

    // Reload trigger when modals close
    const [reloadTick, setReloadTick] = useState(0);

    const [formData, setFormData] = useState({
        fullName: '', phoneNumber: '', dob: '', avatar: ''
    });

    // ─── Load dữ liệu theo tab ─────────────────────────────────
    useEffect(() => {
        if (!loading && !user) { router.push('/login'); return; }
        if (!user) return;

        setFormData({
            fullName: user.fullName || '',
            phoneNumber: user.phoneNumber || '',
            dob: user.dob || '',
            avatar: user.avatar || '',
        });

        if (activeTab === 'orders') {
            getOrdersByUser(user.id).then(async data => {
                const userOrders = data || [];
                setOrders(userOrders);

                const completedOrders = userOrders.filter(o => o.status === 'COMPLETED');
                if (completedOrders.length > 0) {
                    const statusMap = {};
                    await Promise.all(completedOrders.map(async order => {
                        try {
                            statusMap[order.id] = await getReviewStatusByOrder(order.id);
                        } catch (_) { }
                    }));
                    setOrderReviewStatus(statusMap);
                }
            });
        }

        if (activeTab === 'address') {
            addressService.getAllMyAddresses().then(res => {
                if (res.result) {
                    setAddresses(res.result.sort((a, b) => {
                        const ad = a.default || a.isDefault;
                        const bd = b.default || b.isDefault;
                        return (bd ? 1 : 0) - (ad ? 1 : 0);
                    }));
                }
            });
        }
    }, [user, loading, activeTab, router, reloadTick]);

    const handleModalSuccess = () => setReloadTick(t => t + 1);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Vui lòng chọn file ảnh!');
        if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh quá lớn (Max 5MB)!');
        try {
            setIsUploadingAvatar(true);
            const imageUrl = await uploadUserAvatar(file);
            setFormData(prev => ({ ...prev, avatar: imageUrl }));
            toast.success("Tải ảnh lên thành công! Bấm 'Lưu thay đổi' để cập nhật.");
        } catch { toast.error("Lỗi khi tải ảnh lên!"); }
        finally { setIsUploadingAvatar(false); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateUserProfile(user.id, formData);
            toast.success("Cập nhật thông tin thành công!");
            window.location.reload();
        } catch { toast.error("Có lỗi xảy ra khi cập nhật!"); }
    };

    if (loading || !user) return (
        <div className="min-h-screen flex items-center justify-center font-sans">
            <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
    );

    const displayAvatar = formData.avatar ||
        `https://ui-avatars.com/api/?name=${user.fullName || user.username}&background=0f172a&color=fff&size=128&bold=true`;

    const getReviewUi = (orderStatus, orderId, orderItemId) => {
        if (orderStatus !== 'COMPLETED') return { text: 'Chưa đủ điều kiện', className: 'bg-gray-50 text-gray-500 border-gray-200', canReview: false };
        const statuses = orderReviewStatus[orderId];
        if (!statuses) return { text: 'Đang tải...', className: 'bg-gray-50 text-gray-500', canReview: false };
        const item = statuses.find(s => s.orderItemId === orderItemId);
        if (!item || !item.reviewed) return { text: 'Chưa đánh giá', className: 'bg-gray-50 text-gray-700 border-gray-200', canReview: true };
        const status = item.reviewStatus;
        return {
            text: ReviewStatusMap[status] || status,
            className: status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200',
            canReview: false,
        };
    };

    // ─── Tính năng Cancel / Return ────────────────────────────
    const canCancel = (order) => {
        if (['PENDING', 'CONFIRMED'].includes(order.status)) return true;
        // Cho phép hủy nếu đang SHIPPING nhưng GHN chưa lấy hàng
        if (order.status === 'SHIPPING' && (!order.trackingStatus || order.trackingStatus === 'ready_to_pick')) return true;
        return false;
    };

    const canReturn = (order) => {
        // Chỉ cho hoàn trả khi đã giao thành công vật lý
        return order.status === 'COMPLETED' && order.trackingStatus === 'delivered';
    };

    const cannotCancelShipping = (order) => {
        // Chặn hủy khi hàng đã bốc lên xe
        return order.status === 'SHIPPING' && order.trackingStatus && order.trackingStatus !== 'ready_to_pick';
    };

    return (
        <div className="bg-white min-h-screen py-12 font-sans border-t border-gray-100">
            <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row gap-10 mt-16 md:mt-20">

                {/* ─── SIDEBAR ──────────────────────────────────── */}
                <div className="w-full md:w-1/4 shrink-0">
                    <div className="sticky top-28">
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group mb-4">
                                <img
                                    src={displayAvatar}
                                    alt="Avatar"
                                    className={`w-24 h-24 rounded-full object-cover shadow-sm border border-gray-200 transition-opacity ${isUploadingAvatar ? 'opacity-50' : ''}`}
                                />
                                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    {isUploadingAvatar
                                        ? <Loader2 className="text-white animate-spin" size={24} />
                                        : <Camera className="text-white" size={24} />
                                    }
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                                </label>
                            </div>
                            <h2 className="font-black text-xl text-gray-900 tracking-tight">{user.fullName || user.username}</h2>
                            <p className="text-md text-gray-500 mt-1">{user.email}</p>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {[
                                { key: 'profile', icon: <User size={18} />, label: 'Tài khoản' },
                                { key: 'address', icon: <MapPin size={18} />, label: 'Địa chỉ' },
                                { key: 'orders', icon: <Package size={18} />, label: 'Đơn mua' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${activeTab === tab.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-md font-bold text-gray-500 hover:text-red-600 transition-colors cursor-pointer uppercase tracking-wider">
                                <LogOut size={16} /> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── CONTENT ──────────────────────────────────── */}
                <div className="w-full md:w-3/4">

                    {/* TAB: PROFILE */}
                    {activeTab === 'profile' && (
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">Thông tin tài khoản</h3>
                            <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Họ và tên', key: 'fullName', type: 'text', disabled: false },
                                        { label: 'Tên đăng nhập', value: user.username, type: 'text', disabled: true },
                                        { label: 'Số điện thoại', key: 'phoneNumber', type: 'tel', disabled: false },
                                        { label: 'Email', value: user.email, type: 'email', disabled: true },
                                        { label: 'Ngày sinh', key: 'dob', type: 'date', disabled: false },
                                    ].map(f => (
                                        <div key={f.label}>
                                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{f.label}</label>
                                            <input
                                                type={f.type}
                                                value={f.value ?? formData[f.key]}
                                                disabled={f.disabled}
                                                onChange={f.key ? e => setFormData({ ...formData, [f.key]: e.target.value }) : undefined}
                                                className={`w-full border px-4 py-3 rounded-md text-md outline-none transition-all ${f.disabled ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" className="px-8 py-3.5 bg-gray-900 text-white text-md font-bold rounded-md hover:bg-black transition-colors flex items-center gap-2 uppercase tracking-wider cursor-pointer">
                                    <Save size={16} /> LƯU THAY ĐỔI
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB: ADDRESS */}
                    {activeTab === 'address' && (
                        <div>
                            <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Sổ địa chỉ</h3>
                                <Link href="/setup-address?redirect=/profile?tab=address"
                                    className="px-4 py-2 border border-gray-900 text-gray-900 text-md font-bold rounded-md hover:bg-gray-900 hover:text-white transition-colors uppercase tracking-wider">
                                    + Thêm mới
                                </Link>
                            </div>
                            {addresses.length > 0 ? (
                                <div className="space-y-4">
                                    {addresses.map(addr => {
                                        const isDefault = addr.default || addr.isDefault;
                                        return (
                                            <div key={addr.id} className={`p-6 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border transition-colors ${isDefault ? 'border-gray-900 bg-gray-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className="space-y-1 text-md">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-bold text-base text-gray-900">{addr.receiverName}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-gray-600">{addr.phone}</span>
                                                    </div>
                                                    <p className="text-gray-600">{addr.streetAddress}</p>
                                                    <p className="text-gray-600">{addr.wardName}, {addr.districtName}, {addr.provinceName}</p>
                                                    {isDefault && (
                                                        <div className="mt-3 inline-block px-2 py-1 border border-gray-800 text-gray-800 text-[10px] font-bold uppercase tracking-wider bg-white">
                                                            Mặc định
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 border border-dashed border-gray-300 rounded-md bg-gray-50">
                                    <MapPin className="mx-auto text-gray-300 mb-3" size={32} />
                                    <p className="text-gray-500 text-md">Bạn chưa thiết lập địa chỉ giao hàng.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: ORDERS */}
                    {activeTab === 'orders' && (
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">Lịch sử đơn hàng</h3>

                            {orders.length > 0 ? (
                                <div className="space-y-6">
                                    {[...orders].reverse().map(order => (
                                        <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors shadow-sm">

                                            {/* ─── Header đơn hàng ──────────────────────── */}
                                            <div className="flex flex-wrap justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-100 gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-900 text-lg">#{order.id}</span>
                                                    <StatusBadge status={order.status} />
                                                </div>

                                                {/* ─── Nút hành động ──────────────────────── */}
                                                <div className="flex flex-wrap items-center gap-2">

                                                    {/* Nút đánh giá */}
                                                    {order.status === 'COMPLETED' && (
                                                        <button
                                                            onClick={() => setReviewingOrderId(order.id)}
                                                            className="px-3 py-1.5 text-sm font-bold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                            ★ Đánh giá
                                                        </button>
                                                    )}

                                                    {/* Nút yêu cầu hoàn trả */}
                                                    {canReturn(order) && (
                                                        <button
                                                            onClick={() => setReturningOrder(order)}
                                                            className="px-3 py-1.5 text-sm font-bold border border-amber-500 text-amber-700 bg-white hover:bg-amber-50 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                            <RotateCcw size={12} /> Hoàn trả
                                                        </button>
                                                    )}

                                                    {/* Nút hủy đơn */}
                                                    {canCancel(order) && (
                                                        <button
                                                            onClick={() => setCancellingOrder(order)}
                                                            className="px-3 py-1.5 text-sm font-bold border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                            <XCircle size={12} /> Hủy đơn
                                                        </button>
                                                    )}

                                                    {/* Tooltip khi đang SHIPPING mà không được hủy */}
                                                    {cannotCancelShipping(order) && (
                                                        <div className="group relative">
                                                            <button
                                                                disabled
                                                                className="px-3 py-1.5 text-sm font-bold border border-gray-200 text-gray-400 bg-gray-50 rounded-full cursor-not-allowed flex items-center gap-1"
                                                            >
                                                                <XCircle size={12} /> Hủy đơn
                                                            </button>
                                                            <div className="absolute top-full right-0 mb-2 w-64 bg-gray-800 text-white text-[14px] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                                <div className="flex gap-1.5">
                                                                    <Info size={12} className="shrink-0 mt-0.5 text-yellow-400" />
                                                                    Đơn hàng đang vận chuyển, không thể hủy online. Vui lòng từ chối nhận hàng khi shipper gọi để hủy đơn.
                                                                </div>
                                                                <div className="absolute bottom-full right-4 w-2 h-2 bg-gray-800 rotate-45 -mb-1" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ─── Thông tin đơn ──────────────────────── */}
                                            <div className="px-5 py-4">
                                                <OrderPriceSummary order={order} formatCurrency={formatCurrency} />

                                                {/* Return description preview */}
                                                {order.returnDescription && (
                                                    <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                                        <p className="text-sm font-bold text-amber-800 mb-1">Mô tả yêu cầu hoàn trả:</p>
                                                        <p className="text-sm text-amber-700 line-clamp-2">{order.returnDescription}</p>
                                                        {order.returnImageUrls?.length > 0 && (
                                                            <div className="flex gap-1.5 mt-2">
                                                                {order.returnImageUrls.slice(0, 4).map((url, i) => (
                                                                    <img key={i} src={url} alt="" className="w-10 h-10 rounded-lg object-cover border border-amber-200" />
                                                                ))}
                                                                {order.returnImageUrls.length > 4 && (
                                                                    <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-sm font-bold text-amber-700">
                                                                        +{order.returnImageUrls.length - 4}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Tracking info */}
                                                {(order.trackingCode || order.trackingMessage) && (
                                                    <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full shrink-0">
                                                            <Truck size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                                                Mã vận đơn:
                                                                <span className="font-mono tracking-widest text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-sm">
                                                                    {order.trackingCode || 'Đang cập nhật'}
                                                                </span>
                                                            </div>
                                                            {order.trackingMessage && (
                                                                <p className="text-sm text-blue-700 mt-1">{order.trackingMessage}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Sản phẩm */}
                                                <div>
                                                    <div className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Sản phẩm</div>
                                                    <div className="space-y-2">
                                                        {order.orderItems?.map(item => {
                                                            const reviewUi = getReviewUi(order.status, order.id, item.id);
                                                            return (
                                                                <div key={`${order.id}-${item.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                                                                    <div className="text-md text-gray-700">
                                                                        <span className="font-semibold text-gray-900">{item.productName}</span>
                                                                        <span className="text-gray-500 ml-1">x{item.quantity}</span>
                                                                    </div>
                                                                    {/* KHU VỰC HIỂN THỊ GIÁ LÚC MUA */}
                                                                    <div className="text-left shrink-0">
                                                                        <p className="font-bold text-gray-900">
                                                                            {/* Dự phòng: Lấy priceAtPurchase, nếu không có thì lấy price, nếu không có nữa thì cho bằng 0 */}
                                                                            {formatCurrency(Number(item.priceAtPurchase || item.price || 0))}
                                                                        </p>
                                                                        {item.quantity > 1 && (
                                                                            <p className="text-sm text-gray-500 mt-0.5">
                                                                                Tổng: {formatCurrency(Number(item.priceAtPurchase || item.price || 0) * Number(item.quantity || 1))}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border rounded ${reviewUi.className}`}>
                                                                            {reviewUi.text}
                                                                        </span>
                                                                        {reviewUi.canReview && (
                                                                            <button
                                                                                onClick={() => setReviewingOrderId(order.id)}
                                                                                className="text-sm font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider cursor-pointer"
                                                                            >
                                                                                Viết đánh giá
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                    <Package className="mx-auto text-gray-300 mb-4" size={40} strokeWidth={1.5} />
                                    <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
                                    <Link href="/" className="inline-block px-6 py-2 bg-gray-900 text-white text-md font-bold rounded hover:bg-black transition-colors uppercase tracking-wider">
                                        Bắt đầu mua sắm
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── MODALS ────────────────────────────────────── */}
            {reviewingOrderId && (
                <OrderReviewModal
                    orderId={reviewingOrderId}
                    onClose={() => setReviewingOrderId(null)}
                />
            )}

            {cancellingOrder && (
                <CancelOrderModal
                    order={cancellingOrder}
                    onClose={() => setCancellingOrder(null)}
                    onSuccess={handleModalSuccess}
                />
            )}

            {returningOrder && (
                <ReturnOrderModal
                    order={returningOrder}
                    onClose={() => setReturningOrder(null)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
}