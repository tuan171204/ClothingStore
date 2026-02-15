import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar bên trái */}
            <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden md:block">
                <div className="p-6 text-xl font-bold border-b border-gray-700">
                    Admin Portal
                </div>
                <nav className="mt-6">
                    <ul>
                        <li>
                            <Link href="/admin/dashboard" className="block px-6 py-3 hover:bg-gray-800">
                                📊 Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/products" className="block px-6 py-3 hover:bg-gray-800">
                                📦 Quản lý Sản phẩm
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/orders" className="block px-6 py-3 hover:bg-gray-800">
                                🛒 Quản lý Đơn hàng
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/categories" className="block px-6 py-3 hover:bg-gray-800">📂 Danh mục</Link>
                        </li>
                        <li>
                            <Link href="/admin/brands" className="block px-6 py-3 hover:bg-gray-800">🏷️ Thương hiệu</Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Nội dung chính bên phải */}
            <div className="flex-1 flex flex-col">
                {/* Header nhỏ phía trên */}
                <header className="bg-white shadow h-16 flex items-center px-6">
                    <h2 className="font-semibold text-gray-700">Xin chào, Admin!</h2>
                </header>

                {/* Nơi nội dung của page.jsx sẽ hiện ra chính là ở {children} này */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}