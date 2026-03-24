'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, MapPin, Package, Camera, Save, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getOrdersByUser } from '@/services/orderService';
import { addressService } from '@/services/addressService';
import { uploadUserAvatar } from '@/services/uploadService';
import { updateUserProfile } from '@/services/userService';
import Link from 'next/link';
import { formatCurrency } from '@/services/productService';
import { getMyReviewsByProducts } from '@/services/reviewService';

export default function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'profile';

    const [activeTab, setActiveTab] = useState('profile');
    const [orders, setOrders] = useState([]);
    const [reviewMap, setReviewMap] = useState({});

    // Đổi state này thành mảng để chứa toàn bộ sổ địa chỉ
    const [addresses, setAddresses] = useState([]);

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const orderMapping = {
        "PENDING": "Chờ xác nhận",
        "SHIPPING": "Đang giao hàng",
        "COMPLETED": "Hoàn thành",
        "CANCELLED": "Đã hủy"
    }

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        dob: '',
        avatar: ''
    });

    const reviewStatusMapping = {
        PENDING: 'Đang chờ duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED: 'Bị từ chối'
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user) {
            setFormData({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
                dob: user.dob || '',
                avatar: user.avatar || ''
            });

            if (activeTab === 'orders') {
                getOrdersByUser(user.id).then(async (data) => {
                    const userOrders = data || [];
                    setOrders(userOrders);

                    const productIds = [...new Set(
                        userOrders.flatMap(order =>
                            (order.orderItems || [])
                                .map(item => item.productId)
                                .filter(Boolean)
                        )
                    )];

                    if (productIds.length === 0) {
                        setReviewMap({});
                        return;
                    }

                    try {
                        const myReviews = await getMyReviewsByProducts(productIds);
                        const nextReviewMap = myReviews.reduce((acc, review) => {
                            acc[review.productId] = review;
                            return acc;
                        }, {});
                        setReviewMap(nextReviewMap);
                    } catch (error) {
                        console.error('Lỗi tải trạng thái đánh giá:', error);
                        setReviewMap({});
                    }
                });
            }

            if (activeTab === 'address') {
                // Lấy toàn bộ danh sách địa chỉ
                addressService.getAllMyAddresses().then(res => {
                    if (res.result) {
                        // Sắp xếp để địa chỉ mặc định luôn nằm trên cùng
                        const sortedAddresses = res.result.sort((a, b) => {
                            const aIsDefault = a.default || a.isDefault;
                            const bIsDefault = b.default || b.isDefault;
                            return (bIsDefault === true ? 1 : 0) - (aIsDefault === true ? 1 : 0);
                        });
                        setAddresses(sortedAddresses);
                    }
                });
            }
        }
    }, [user, loading, activeTab, router]);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            return toast.error('Vui lòng chọn file ảnh!');
        }
        if (file.size > 5 * 1024 * 1024) {
            return toast.error('Ảnh quá lớn (Max 5MB)!');
        }

        try {
            setIsUploadingAvatar(true);
            const imageUrl = await uploadUserAvatar(file);
            setFormData(prev => ({ ...prev, avatar: imageUrl }));
            toast.success("Tải ảnh lên thành công! Bấm 'Lưu thay đổi' để cập nhật.");
        } catch (error) {
            toast.error("Lỗi khi tải ảnh lên!");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateUserProfile(user.id, formData);
            toast.success("Cập nhật thông tin thành công!");
            window.location.reload();
        } catch (error) {
            toast.error("Có lỗi xảy ra khi cập nhật!");
        }
    };

    if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-sans">Đang tải dữ liệu...</div>;

    const displayAvatar = formData.avatar || `https://ui-avatars.com/api/?name=${user.fullName || user.username}&background=0f172a&color=fff&size=128&bold=true`;

    const getReviewUi = (orderStatus, productId) => {
        const myReview = productId ? reviewMap[productId] : null;

        if (myReview?.status) {
            return {
                text: reviewStatusMapping[myReview.status] || myReview.status,
                className: myReview.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : myReview.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
            };
        }

        if (orderStatus === 'COMPLETED') {
            return {
                text: 'Chưa đánh giá',
                className: 'bg-gray-50 text-gray-700 border-gray-200'
            };
        }

        return {
            text: 'Chưa đủ điều kiện đánh giá',
            className: 'bg-gray-50 text-gray-500 border-gray-200'
        };
    };

    return (
        <div className="bg-white min-h-screen py-12 font-sans border-t border-gray-100">
            <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row gap-10 mt-30">

                {/* --- SIDEBAR TRÁI --- */}
                <div className="w-full md:w-1/4 shrink-0">
                    <div className="sticky top-28">
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group mb-4">
                                <img
                                    src={displayAvatar}
                                    alt="Avatar"
                                    className={`w-24 h-24 rounded-full object-cover shadow-sm border border-gray-200 transition-opacity ${isUploadingAvatar ? 'opacity-50' : 'opacity-100'}`}
                                />
                                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    {isUploadingAvatar ? (
                                        <Loader2 className="text-white animate-spin" size={24} />
                                    ) : (
                                        <Camera className="text-white" size={24} />
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                                </label>
                            </div>
                            <h2 className="font-black text-xl text-gray-900 tracking-tight">{user.fullName || user.username}</h2>
                            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                        </div>

                        <nav className="flex flex-col gap-1">
                            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'profile' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'} cursor-pointer`}>
                                <User size={18} strokeWidth={2.5} /> Tài khoản
                            </button>
                            <button onClick={() => setActiveTab('address')} className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'address' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'} cursor-pointer`}>
                                <MapPin size={18} strokeWidth={2.5} /> Địa chỉ
                            </button>
                            <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'orders' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'} cursor-pointer`}>
                                <Package size={18} strokeWidth={2.5} /> Đơn mua
                            </button>
                        </nav>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors cursor-pointer uppercase tracking-wider">
                                <LogOut size={16} strokeWidth={2.5} /> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- CONTENT PHẢI --- */}
                <div className="w-full md:w-3/4">
                    <div className="min-h-[500px]">

                        {/* TAB 1: PROFILE */}
                        {activeTab === 'profile' && (
                            <div className="animate-fade-in">
                                <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">Thông tin tài khoản</h3>
                                <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Họ và tên</label>
                                            <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tên đăng nhập</label>
                                            <input type="text" value={user.username} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 px-4 py-3 rounded-md cursor-not-allowed text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                                            <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                                            <input type="email" value={user.email} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 px-4 py-3 rounded-md cursor-not-allowed text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày sinh</label>
                                            <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <button type="submit" className="px-8 py-3.5 bg-gray-900 text-white text-sm font-bold rounded-md hover:bg-black transition-colors flex items-center gap-2 uppercase tracking-wider cursor-pointer">
                                            <Save size={16} /> LƯU THAY ĐỔI
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 2: ADDRESS (ĐÃ CẬP NHẬT THÀNH DANH SÁCH) */}
                        {activeTab === 'address' && (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Sổ địa chỉ</h3>
                                    <Link href="/setup-address?redirect=/profile?tab=address"
                                        className="px-4 py-2 border border-gray-900 text-gray-900 text-sm font-bold rounded-md hover:bg-gray-900 hover:text-white transition-colors uppercase tracking-wider cursor-pointer">
                                        + Thêm mới
                                    </Link>
                                </div>

                                {addresses && addresses.length > 0 ? (
                                    <div className="space-y-4">
                                        {addresses.map((addr) => {
                                            // Xử lý cẩn thận boolean (tùy thuộc Jackson trả về là isDefault hay default)
                                            const isDefaultAddr = addr.default || addr.isDefault;

                                            return (
                                                <div key={addr.id} className={`p-6 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 transition-colors border ${isDefaultAddr ? 'border-gray-900 bg-gray-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-bold text-base text-gray-900">{addr.receiverName}</span>
                                                            <span className="text-gray-300">|</span>
                                                            <span className="text-gray-600 font-medium">{addr.phone}</span>
                                                        </div>
                                                        <p className="text-gray-600">{addr.streetAddress}</p>
                                                        <p className="text-gray-600">{addr.wardName}, {addr.districtName}, {addr.provinceName}</p>

                                                        {isDefaultAddr && (
                                                            <div className="mt-3 inline-block px-2 py-1 border border-gray-800 text-gray-800 text-[10px] font-bold uppercase tracking-wider bg-white">
                                                                Mặc định
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Các nút hành động */}
                                                    <div className="flex sm:flex-col items-center sm:items-end gap-4 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto">
                                                        {/* <Link href={`/setup-address?edit=${addr.id}&redirect=/profile?tab=address`}
                                                         className="text-sm font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors">
                                                            Sửa
                                                        </Link> */}

                                                        {!isDefaultAddr && (
                                                            <button
                                                                onClick={() => {
                                                                    toast.info("Tính năng xóa địa chỉ đang được phát triển!");
                                                                }}
                                                                className="text-sm font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors cursor-pointer"
                                                            >
                                                                Xóa
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 border border-dashed border-gray-300 rounded-md bg-gray-50">
                                        <MapPin className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-gray-500 text-sm">Bạn chưa thiết lập địa chỉ giao hàng.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: ORDERS */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">Lịch sử đơn hàng</h3>

                                {orders.length > 0 ? (
                                    <div className="space-y-6">
                                        {[...orders].reverse().map(order => (
                                            <div key={order.id} className="border border-gray-200 rounded-md p-6 hover:border-gray-400 transition-colors">
                                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                                    <span className="font-bold text-gray-900 text-lg">#{order.id}</span>
                                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        order.status === 'SHIPPING' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            'bg-gray-100 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {orderMapping[order.status] || order.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                                    <div className="text-sm text-gray-500 space-y-1">
                                                        <p>Ngày đặt: <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span></p>
                                                        <p>Thanh toán: <span className="font-medium text-gray-900">{order.paymentMethod}</span></p>
                                                    </div>
                                                    <div className="sm:text-right">
                                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Tổng tiền</div>
                                                        <div className="font-black text-xl text-gray-900">{formatCurrency(order.totalAmount)}</div>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-gray-100">
                                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Tình trạng đánh giá</div>

                                                    {order.orderItems && order.orderItems.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {order.orderItems.map((item) => {
                                                                const reviewUi = getReviewUi(order.status, item.productId);
                                                                return (
                                                                    <div key={`${order.id}-${item.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                                                        <div className="text-sm text-gray-700">
                                                                            <span className="font-semibold text-gray-900">{item.productName}</span>
                                                                            <span className="text-gray-500"> x{item.quantity}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border rounded ${reviewUi.className}`}>
                                                                                {reviewUi.text}
                                                                            </span>
                                                                            {order.status === 'COMPLETED' && item.productId && (
                                                                                <Link href={`/products/${item.productId}`} className="text-xs font-bold text-gray-700 hover:text-gray-900 uppercase tracking-wider">
                                                                                    Đánh giá
                                                                                </Link>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">Không có thông tin sản phẩm trong đơn này.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 border border-dashed border-gray-300 rounded-md bg-gray-50">
                                        <Package className="mx-auto text-gray-300 mb-4" size={40} strokeWidth={1.5} />
                                        <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
                                        <Link href="/" className="inline-block px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded hover:bg-black transition-colors uppercase tracking-wider">
                                            Bắt đầu mua sắm
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}