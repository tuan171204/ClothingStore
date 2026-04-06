'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import {
    LayoutDashboard, Package, ShoppingCart, FolderTree,
    Tag, Inbox, Archive, Star, LogOut, Store, Ticket, Coins, Truck, Zap
} from 'lucide-react';

// ==========================================
// COMPONENT SIDEBAR TÁCH RỜI (DÙNG ĐỂ GỌI CONTEXT)
// ==========================================
function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAdminAuth();

    // Cấu hình menu dễ dàng thêm bớt
    const navItems = [
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/products', icon: Package, label: 'Sản phẩm' },
        { href: '/admin/pircing', icon: Coins, label: 'Quản lý giá' },
        { href: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
        { href: '/admin/ghn-simulator', icon: Truck, label: 'GHN Webhook Test' },
        { href: '/admin/categories', icon: FolderTree, label: 'Danh mục' },
        { href: '/admin/brands', icon: Tag, label: 'Thương hiệu' },
        { href: '/admin/goods-receipts', icon: Inbox, label: 'Nhập hàng' },
        { href: '/admin/inventory', icon: Archive, label: 'Tồn hàng' },
        { href: '/admin/reviews', icon: Star, label: 'Duyệt đánh giá' },
        { href: '/admin/coupons', icon: Ticket, label: 'Quản lý Mã giảm giá' },
        { href: '/admin/flash-sales', icon: Zap, label: 'Flash Sale' },
    ];

    return (
        <aside className="w-64 bg-[#111827] text-gray-300 shrink-0 hidden md:flex flex-col h-screen sticky top-0 shadow-xl">
            {/* Logo / Brand Name */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-gray-950">
                <Store className="w-6 h-6 text-blue-500 mr-3" />
                <span className="text-xl font-black text-white tracking-wide">Admin Portal</span>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
                <nav className="space-y-1.5 px-3">
                    {navItems.map((item) => {
                        // Kiểm tra URL hiện tại có khớp với menu không để highlight
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                        : 'hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-white transition-colors'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Nút Đăng xuất đưa xuống cuối */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className="group flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-gray-400 
                             hover:text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-red-500 
                             hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] 
                             border border-transparent hover:border-red-400/50
                             active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                    <LogOut size={20} className="group-hover:translate-x-1 group-hover:-rotate-12 transition-transform duration-300" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}

// ==========================================
// MAIN LAYOUT
// ==========================================
export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    return (
        <AdminAuthProvider>
            {isLoginPage ? (
                <>{children}</>
            ) : (
                <div className="flex min-h-screen bg-gray-50">
                    {/* Render Sidebar mới */}
                    <Sidebar />

                    <div className="flex-1 flex flex-col min-w-0">
                        <AdminHeader />

                        <main className="flex-1 p-6 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                </div>
            )}
        </AdminAuthProvider>
    );
}