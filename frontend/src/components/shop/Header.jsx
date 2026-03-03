"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import CartButton from './CartButton';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import AuthContext
import { User, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react'; // Import Icon

const Header = () => {
    const { user, logout, loading } = useAuth(); // Lấy state từ Context
    const pathname = usePathname();

    // States
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // State cho dropdown user

    const dropdownRef = useRef(null); // Để xử lý click ra ngoài đóng dropdown

    const isHomePage = pathname === '/';
    const isSolid = isScrolled || !isHomePage;

    // Xử lý scroll đổi màu Header
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 80) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Xử lý click ra ngoài để đóng User Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isSolid
            ? 'bg-white/90 backdrop-blur-md shadow-sm py-3 lg:py-5'
            : 'bg-transparent py-5'
            }`}>
            <div className="container mx-auto px-4 flex items-center justify-between transition-all duration-300">

                {/* Logo */}
                <Link href="/" className={`text-3xl font-bold tracking-tighter transition-colors ${isSolid ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-gray-200'
                    }`}>
                    ClothStore<span className="text-gray-400">.vn</span>
                </Link>

                {/* Menu Desktop */}
                <nav className="hidden md:flex space-x-8 text-lg font-medium">
                    <Link href="/" className={`transition-colors ${isSolid ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                        Trang chủ
                    </Link>
                    <button className={`transition-colors cursor-pointer ${isSolid ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
                        Sản phẩm
                    </button>
                    <button className={`transition-colors cursor-pointer ${isSolid ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}>
                        Giới thiệu
                    </button>
                </nav>

                {/* Khu vực bên phải: Giỏ hàng & User/Login */}
                <div className="flex items-center space-x-5 md:space-x-6">
                    <CartButton isSolid={isSolid} />

                    {/* Kiểm tra trạng thái đăng nhập */}
                    {loading ? (
                        // Đang tải Token
                        <div className="w-8 h-8 rounded-2xl border-2 border-gray-300 border-t-blue-600 animate-spin"></div>
                    ) : user ? (
                        // Đã Đăng Nhập -> Hiển thị Avatar & Dropdown
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all cursor-pointer ${isSolid
                                    ? 'border-gray-200 hover:bg-gray-100 bg-white'
                                    : 'border-white/10 hover:bg-white/10 bg-black/20 backdrop-blur-sm'
                                    }`}
                            >
                                <span className={`text-md font-bold hidden md:block max-w-30 truncate ${isSolid ? 'text-gray-800' : 'text-white'}`}>
                                    {user.fullName || user.username}
                                </span>
                                {/* Tạo Avatar chữ cái tự động */}
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName || user.username}&background=2563eb&color=fff&bold=true}`}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full border border-white/50"
                                />
                                <ChevronDown size={16} className={`${isSolid ? 'text-gray-600' : 'text-white'}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-3 w-62.5 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-md font-bold text-gray-800 truncate">{user.fullName}</p>
                                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="p-2 flex flex-col">
                                        {/* Nút vào Admin (Chỉ hiện nếu có Role Admin/Staff) */}
                                        {(user.role?.name === 'ADMIN' || user.role?.name === 'STAFF') && (
                                            <Link
                                                href="/admin/dashboard"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 text-md font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                            >
                                                <LayoutDashboard size={18} /> Quản trị Admin
                                            </Link>
                                        )}

                                        <Link
                                            href="/profile"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-md font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                        >
                                            <User size={18} /> Tài khoản của tôi
                                        </Link>
                                        <Link
                                            href="/profile" // Hoặc tạo trang /orders riêng
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-md font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                        >
                                            <Settings size={18} /> Cài đặt & Địa chỉ
                                        </Link>
                                        <div className="h-px bg-gray-100 my-1"></div>
                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                logout();
                                            }}
                                            className="flex items-center gap-3 px-3 py-2.5 text-md font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer w-full text-left"
                                        >
                                            <LogOut size={18} /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Chưa Đăng Nhập -> Hiển thị Nút
                        <>
                            <Link href="/login" className={`px-3 py-2 md:px-4 md:py-2 text-sm font-bold rounded-md transition-all shadow-md hover:scale-105 ${isSolid
                                ? 'bg-gray-900 text-white hover:bg-black'
                                : 'bg-white text-gray-900 hover:bg-gray-200'
                                }`}>
                                Đăng nhập
                            </Link>

                            <Link href="/register" className={`hidden md:block px-4 py-2 text-sm font-bold rounded-md transition-all shadow-md hover:scale-105 ${isSolid
                                ? 'bg-gray-900 text-white hover:bg-black'
                                : 'bg-white text-gray-900 hover:bg-gray-200'
                                }`}>
                                Đăng ký
                            </Link>
                        </>
                    )}

                    {/* Nút Mobile Menu */}
                    <button
                        className={`md:hidden p-2 transition-colors ${isSolid ? 'text-gray-900' : 'text-white'} cursor-pointer`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 absolute top-full left-0 w-full shadow-lg">
                    {/* Bổ sung hiển thị User trong Mobile Menu */}
                    {user && (
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user.fullName || user.username}&background=2563eb&color=fff&bold=true`}
                                alt="avatar"
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <p className="font-bold text-gray-800">{user.fullName}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <Link href="/" className="block font-medium text-gray-800 hover:text-blue-600">Trang chủ</Link>
                    <button
                        onClick={() => {
                            document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                            setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left font-medium text-gray-800 hover:text-blue-600 cursor-pointer"
                    >
                        Sản phẩm
                    </button>

                    {user && (
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <Link href="/profile" className="block font-medium text-gray-800 hover:text-blue-600">Tài khoản của tôi</Link>
                            <button onClick={logout} className="block font-medium text-red-600 w-full text-left">Đăng xuất</button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;