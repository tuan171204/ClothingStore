'use client'; // Bắt buộc thêm dòng này để dùng hook usePathname

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }) {
    const pathname = usePathname();

    // Kiểm tra xem có đang ở trang đăng nhập không
    const isLoginPage = pathname === '/admin/login';

    return (
        <AdminAuthProvider>
            {isLoginPage ? (
                // Nếu là trang Login, chỉ hiển thị Component con (Form đăng nhập đã căn giữa sẵn)
                <>{children}</>
            ) : (
                // Nếu KHÔNG phải trang Login, hiển thị giao diện Admin Portal đầy đủ
                <div className="flex min-h-screen bg-gray-100">
                    {/* Sidebar bên trái */}
                    <aside className="w-64 bg-gray-900 text-white shrink-0 hidden md:block">
                        <div className="p-6 text-xl font-bold border-b border-gray-700">
                            Admin Portal
                        </div>
                        <nav className="mt-6">
                            <ul className="text-lg font-medium">
                                <li>
                                    <Link href="/admin/dashboard" className="block px-5 py-6 hover:bg-gray-700 border-b-gray-400">
                                        📊 Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/admin/products" className="block px-6 py-6 hover:bg-gray-700 border-b-gray-400">
                                        📦 Quản lý Sản phẩm
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/admin/orders" className="block px-6 py-6 hover:bg-gray-700 border-b-gray-400">
                                        🛒 Quản lý Đơn hàng
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/admin/categories" className="block px-6 py-6 hover:bg-gray-700 border-b-gray-400">📂 Danh mục</Link>
                                </li>
                                <li>
                                    <Link href="/admin/brands" className="block px-6 py-6 hover:bg-gray-700 border-b-gray-400">🏷️ Thương hiệu</Link>
                                </li>
                                <li>
                                    <Link href="/admin/goods-receipts" className="block px-6 py-6 hover:bg-gray-700 border-b-gray-400">📥 Nhập kho</Link>
                                </li>
                                <li>
                                    <Link href="/admin/inventory" className="block px-6 py-6 hover:bg-gray-700 border-b-gray-400">📂 Quản lý Tồn Kho</Link>
                                </li>
                                <li>
                                    <Link href="/admin/reviews" className="block px-6 py-3 hover:bg-gray-800">⭐ Duyệt đánh giá</Link>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    {/* Nội dung chính bên phải */}
                    <div className="flex-1 flex flex-col">
                        {/* Header nhỏ phía trên */}
                        <AdminHeader />

                        {/* Nơi nội dung của các trang con (Dashboard, Products,...) sẽ hiện ra */}
                        <main className="flex-1 p-6 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                </div>
            )}
        </AdminAuthProvider>
    );
}