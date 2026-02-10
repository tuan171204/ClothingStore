"use client";

import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios'; // Đảm bảo đã config baseURL
import { toast } from 'react-toastify';
import {
    LayoutDashboard,
    Package,
    Truck,
    LogOut,
    User,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { shipOrder } from '@/services/orderService';

const AdminOrderPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Lấy danh sách đơn hàng
    const fetchOrders = async () => {
        try {
            // Đảm bảo bạn đã có API GET /orders trả về List<Order>
            const response = await axios.get('/orders');
            // Sort đơn mới nhất lên đầu
            const sortedOrders = response.data.sort((a, b) => b.id - a.id);
            setOrders(sortedOrders);
        } catch (error) {
            toast.error("Không tải được danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // 2. Xử lý Duyệt đơn & Gửi qua GHN
    const handleShipOrder = async (orderId) => {
        if (!window.confirm("Bạn có chắc chắn muốn duyệt và tạo vận đơn GHN cho đơn này?")) return;

        try {
            toast.info("Đang kết nối GHN tạo vận đơn...");
            await shipOrder(orderId); // Gọi cái API Admin Controller bạn vừa viết

            toast.success("✅ Đã tạo vận đơn thành công!");
            fetchOrders(); // Load lại danh sách để cập nhật trạng thái
        } catch (error) {
            console.error(error);
            toast.error("❌ Lỗi: " + (error.response?.data?.message || error.message));
        }
    };

    // Helper: Màu sắc cho trạng thái
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Chờ xử lý</span>;
            case 'CONFIRMED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Đã xác nhận</span>;
            case 'SHIPPING': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">Đang giao (GHN)</span>;
            case 'COMPLETED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Hoàn thành</span>;
            case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Đã hủy</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">📦 Danh sách đơn hàng</h2>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium hover:bg-gray-50">
                        Export Excel
                    </button>
                </div>

                {/* --- TABLE --- */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thanh toán</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GHN Tracking</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center">Đang tải dữ liệu...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Chưa có đơn hàng nào</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.fullName}</div>
                                            <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.totalAmount.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentMethod === 'VNPAY' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {order.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {order.trackingCode || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Logic nút bấm: Chỉ hiện nút Ship nếu chưa Ship */}
                                            {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                                <button
                                                    onClick={() => handleShipOrder(order.id)}
                                                    className="inline-flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow-sm transition"
                                                >
                                                    <Truck size={14} className="mr-1" />
                                                    Duyệt & Giao GHN
                                                </button>
                                            )}

                                            {order.status === 'SHIPPING' && (
                                                <span className="text-purple-600 flex items-center justify-end">
                                                    <CheckCircle size={16} className="mr-1" /> Đã gửi GHN
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AdminOrderPage;