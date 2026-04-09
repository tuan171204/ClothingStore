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
        { href: '/admin/coupons', icon: Ticket, label: 'Mã giảm giá' },
        { href: '/admin/flash-sales', icon: Zap, label: 'Flash Sale' },
    ];

    return (
        <aside className="w-[260px] bg-[#0A0D14] text-gray-300 shrink-0 hidden md:flex flex-col h-screen sticky top-0 border-r border-gray-800/60 z-50">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-800/60">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mr-3">
                    <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-[19px] font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-wide">
                    Admin Portal
                </span>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
                <div className="px-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Quản lý hệ thống
                </div>
                <nav className="space-y-1.5 px-3">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 group overflow-hidden
                                    ${isActive
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-100'
                                    }`}
                            >
                                {/* Thanh highlight dọc cho item active */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]"></div>
                                )}

                                <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="text-[14px] tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Nút Đăng xuất */}
            <div className="p-4 border-t border-gray-800/60 bg-[#0A0D14]">
                <button
                    onClick={logout}
                    className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-gray-400 
                             hover:text-red-400 hover:bg-red-500/10 
                             transition-all duration-300 cursor-pointer"
                >
                    <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-red-500/20 transition-colors">
                        <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-[14px]">Đăng xuất</span>
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