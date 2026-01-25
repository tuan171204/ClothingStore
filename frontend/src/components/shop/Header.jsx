"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import CartButton from './CartButton'; // Tái sử dụng nút giỏ hàng đã làm

const Header = () => {
    // State cho menu mobile (Chuẩn bị sẵn cho tương lai)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tighter hover:text-blue-700">
                    ClothStore<span className="text-gray-400">.vn</span>
                </Link>

                {/* Menu Desktop */}
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

                {/* Khu vực bên phải: Giỏ hàng & Login */}
                <div className="flex items-center space-x-4">

                    {/* Component CartButton nằm ở đây là hoàn toàn hợp lý */}
                    <CartButton />

                    <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-md">
                        Đăng nhập
                    </Link>

                    {/* Nút Mobile Menu (Chỉ hiện trên mobile) */}
                    <button
                        className="md:hidden p-2 text-gray-600"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown (Logic hiển thị đơn giản) */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t p-4 space-y-4">
                    <Link href="/" className="block font-medium text-gray-700">Trang chủ</Link>
                    <Link href="/products" className="block font-medium text-gray-700">Sản phẩm</Link>
                    <Link href="/about" className="block font-medium text-gray-700">Giới thiệu</Link>
                </div>
            )}
        </header>
    );
};

export default Header;