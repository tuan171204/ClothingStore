'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ShoppingCart, AlertTriangle, RotateCcw, Ban, Info } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';
import { getAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const unreadCount = safeNotifications.filter(n => !n.read).length;

    // 1. Lấy dữ liệu API khi vừa load trang
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await getAdminNotifications();

            // Xử lý an toàn: Tìm mảng dữ liệu thật sự
            if (Array.isArray(data)) {
                setNotifications(data); // Backend trả thẳng List<Notification>
            } else if (data && Array.isArray(data.result)) {
                setNotifications(data.result); // Backend trả qua ApiResponse có field result
            } else if (data && Array.isArray(data.data)) {
                setNotifications(data.data); // Backend trả qua field data
            } else {
                setNotifications([]); // Fallback an toàn
            }
        } catch (error) {
            console.error("Lỗi tải thông báo:", error);
        }
    };

    // 2. Kết nối WebSocket
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        // Xử lý URL: "http://localhost:8080/api/v1" -> "http://localhost:8080/ws/notifications"
        const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '');
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}` // Gửi JWT token cho Interceptor ở Spring Boot
            },
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            heartbeatIncoming: 20000,
            heartbeatOutgoing: 20000,
            onConnect: () => {
                console.log("Đã kết nối WebSocket Thông báo!");

                // Lắng nghe kênh Broadcast
                stompClient.subscribe('/topic/admin/notifications', (message) => {
                    const newNotif = JSON.parse(message.body);

                    // Thêm thông báo mới vào đầu danh sách
                    setNotifications(prev => [newNotif, ...prev]);

                    // Hiển thị Toast bay ra trên màn hình
                    toast.info(`🔔 ${newNotif.title}: ${newNotif.message}`, {
                        position: "bottom-right",
                        autoClose: 5000,
                    });
                });
            },
            onStompError: (frame) => {
                console.error("Lỗi STOMP:", frame.headers['message']);
            }
        });

        stompClient.activate();

        // Cleanup khi component unmount
        return () => {
            if (stompClient.active) {
                stompClient.deactivate();
            }
        };
    }, []);

    // 3. Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 4. Các hàm xử lý tương tác
    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation(); // Ngăn click lan ra ngoài
        try {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllAsRead = async (e) => {
        e.stopPropagation();
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.read) handleMarkAsRead(notif.id);
        setShowDropdown(false);

        // Chuyển hướng dựa theo Type
        if (['NEW_ORDER', 'NEW_RETURN_REQUEST', 'NEW_CANCEL_ORDER'].includes(notif.type)) {
            // Có thể filter hoặc mở modal luôn, ở đây chuyển về trang orders
            router.push(`/admin/orders?keyword=${notif.referenceId}`);
        } else if (notif.type === 'LOW_STOCK') {
            router.push(`/admin/products`);
        }
    };

    // Hàm phụ trợ: Chọn Icon theo Type
    const getIconForType = (type) => {
        switch (type) {
            case 'NEW_ORDER': return <ShoppingCart size={18} className="text-blue-500" />;
            case 'LOW_STOCK': return <AlertTriangle size={18} className="text-red-500" />;
            case 'NEW_RETURN_REQUEST': return <RotateCcw size={18} className="text-amber-500" />;
            case 'NEW_CANCEL_ORDER': return <Ban size={18} className="text-red-500" />;
            default: return <Info size={18} className="text-gray-500" />;
        }
    };

    // Hàm phụ trợ: Hiển thị thời gian
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Chuông */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-gray-500 hover:text-gray-900 relative transition-colors cursor-pointer p-1"
            >
                <Bell size={24} className={unreadCount > 0 ? "animate-[wiggle_1s_ease-in-out_infinite]" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[14px] font-bold rounded-full flex items-center justify-center border-2 border-white px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Box */}
            {showDropdown && (
                <div className="absolute top-full right-0 mt-3 w-150 sm:w-96 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-fade-in z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-100 overflow-y-auto">
                        {safeNotifications.length === 0 ? (
                            <div className="p-6 text-center text-lg text-gray-500 flex flex-col items-center gap-2">
                                <Bell size={24} className="text-gray-300" />
                                Không có thông báo nào.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {safeNotifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 hover:bg-gray-50 flex gap-3 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notif.read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            {getIconForType(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className={`text-lg truncate pr-2 ${!notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[14px] font-medium text-gray-400 shrink-0 mt-0.5">
                                                    {formatTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-sm leading-relaxed line-clamp-2 ${!notif.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                                {notif.message}
                                            </p>
                                        </div>
                                        {/* Nút check (chỉ hiện khi chưa đọc) */}
                                        {!notif.read && (
                                            <button
                                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                className="shrink-0 w-6 h-6 rounded-full hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                                                title="Đánh dấu đã đọc"
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-100 text-center bg-gray-50">
                        <span className="text-sm text-gray-400">Lưu trữ 50 thông báo gần nhất</span>
                    </div>
                </div>
            )}
        </div>
    );
}