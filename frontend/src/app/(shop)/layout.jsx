import React from 'react';
import Link from 'next/link';

export default function ShopLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen font-sans text-gray-800">
            {/* --- HEADER (Thanh điều hướng) --- */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tighter hover:text-blue-700">
                        ClothStore<span className="text-gray-400">.vn</span>
                    </Link>

                    {/* Menu chính */}
                    <nav className="hidden md:flex space-x-8">
                        <Link href="/" className="font-medium hover:text-blue-600 transition">
                            Trang chủ
                        </Link>
                        <Link href="/products" className="font-medium hover:text-blue-600 transition">
                            Sản phẩm
                        </Link>
                        <Link href="/about" className="font-medium hover:text-blue-600 transition">
                            Giới thiệu
                        </Link>
                    </nav>

                    {/* Nút Giỏ hàng & Tài khoản */}
                    <div className="flex items-center space-x-4">
                        <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition group">
                            {/* Icon giỏ hàng đơn giản (SVG) */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600 group-hover:text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            {/* Badge số lượng (Demo) */}
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                                3
                            </span>
                        </Link>

                        <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-md">
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT (Nội dung thay đổi theo từng trang) --- */}
            <main className="flex-1 bg-gray-50">
                {/* {children} chính là nội dung của file page.jsx tương ứng */}
                {children}
            </main>

            {/* --- FOOTER (Chân trang) --- */}
            <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">TechStore.vn</h3>
                        <p className="text-sm">Hệ thống bán lẻ hàng đầu dành cho sinh viên IT.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Liên kết</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/products" className="hover:text-white">Laptop Gaming</Link></li>
                            <li><Link href="/products" className="hover:text-white">Bàn phím cơ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-white">Chính sách bảo hành</Link></li>
                            <li><Link href="#" className="hover:text-white">Tra cứu đơn hàng</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
                        <p className="text-sm">Hotline: 1900 1000</p>
                        <p className="text-sm">Email: support@techstore.vn</p>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                    &copy; {new Date().getFullYear()} TechStore. All rights reserved.
                </div>
            </footer>
        </div>
    );
}