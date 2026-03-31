'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useRouter } from 'next/navigation';
import {
    Bell, Search, UserCircle, LayoutDashboard, Package,
    ShoppingCart, FolderTree, Tag, Inbox, Archive, Star
} from 'lucide-react';

// Danh sách các chức năng để Search
const searchableFeatures = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/products', icon: Package, label: 'Quản lý Sản phẩm' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Quản lý Đơn hàng' },
    { href: '/admin/categories', icon: FolderTree, label: 'Quản lý Danh mục' },
    { href: '/admin/brands', icon: Tag, label: 'Quản lý Thương hiệu' },
    { href: '/admin/goods-receipts', icon: Inbox, label: 'Nhập kho' },
    { href: '/admin/inventory', icon: Archive, label: 'Quản lý Tồn kho' },
    { href: '/admin/reviews', icon: Star, label: 'Duyệt đánh giá' },
];

export default function AdminHeader() {
    const { adminUser } = useAdminAuth();
    const router = useRouter();

    // State cho Search
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    // Lọc kết quả theo từ khóa
    const filteredFeatures = searchableFeatures.filter(feature =>
        feature.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Xử lý click ra ngoài vùng search thì đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectFeature = (href) => {
        router.push(href);
        setShowDropdown(false);
        setSearchTerm(''); // Clear ô search sau khi chuyển trang
    };

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm font-sans">

            {/* Khối Search */}
            <div className="relative z-50" ref={searchRef}>
                <div className={`flex items-center bg-gray-100 px-4 py-2.5 rounded-xl w-80 transition-all border
                    ${showDropdown && searchTerm ? 'border-blue-500 bg-white ring-4 ring-blue-500/10' : 'border-transparent focus-within:border-blue-500 focus-within:bg-white'}
                `}>
                    <Search size={18} className="text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm chức năng... (Vd: Đơn hàng)"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="bg-transparent border-none outline-none ml-3 w-full text-sm text-gray-700 placeholder-gray-400 font-medium"
                    />
                </div>

                {/* Dropdown Kết quả */}
                {showDropdown && searchTerm.trim() !== '' && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-2 overflow-hidden animate-fade-in">
                        {filteredFeatures.length > 0 ? (
                            filteredFeatures.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectFeature(feature.href)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50/50 flex items-center gap-3 text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors cursor-pointer group"
                                    >
                                        <Icon size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                        {feature.label}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-4 py-4 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                                <Search size={24} className="text-gray-300" />
                                Không tìm thấy chức năng nào
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Khối bên phải: Notification & User Info */}
            <div className="flex items-center gap-5">
                <button className="text-gray-500 hover:text-gray-900 relative transition-colors cursor-pointer">
                    <Bell size={22} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-7 w-px bg-gray-200"></div>

                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pr-2 rounded-xl transition-colors">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                            {adminUser?.fullName || 'Administrator'}
                        </p>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider leading-none">
                            {adminUser?.role?.name || 'ADMIN'}
                        </p>
                    </div>

                    {adminUser?.avatar ? (
                        <img
                            src={adminUser.avatar}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
                        />
                    ) : (
                        <UserCircle size={36} className="text-gray-300" />
                    )}
                </div>
            </div>
        </header>
    );
}