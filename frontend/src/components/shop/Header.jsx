"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import CartButton from './CartButton';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';

const Header = () => {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const dropdownRef = useRef(null);

    const isHomePage = pathname === '/';
    const isSolid = isScrolled || !isHomePage;

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ADDED: close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isSolid
            ? 'bg-white/90 backdrop-blur-md shadow-sm py-3 lg:py-5'
            : 'bg-transparent py-5'
            }`}>
            {/* ADDED: px-4 sm:px-6 for tighter mobile padding */}
            <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between transition-all duration-300">

                {/* Logo — ADDED: text-2xl on mobile, 3xl on desktop */}
                <Link href="/" className={`text-2xl sm:text-3xl font-bold tracking-tighter transition-colors ${isSolid ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-gray-200'
                    }`}>
                    ClothStore<span className="text-gray-400">.vn</span>
                </Link>

                {/* Menu Desktop — unchanged */}
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

                {/* Right area — ADDED: space-x-3 on mobile, space-x-5 on md+ */}
                <div className="flex items-center space-x-3 md:space-x-5 lg:space-x-6">
                    <CartButton isSolid={isSolid} />

                    {loading ? (
                        <div className="w-7 h-7 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"></div>
                    ) : user ? (
                        <div className="relative" ref={dropdownRef}>
                            {/* ADDED: condensed on mobile — only show avatar, not name */}
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className={`flex items-center gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border transition-all cursor-pointer ${isSolid
                                    ? 'border-gray-200 hover:bg-gray-100 bg-white'
                                    : 'border-white/10 hover:bg-white/10 bg-black/20 backdrop-blur-sm'
                                    }`}
                            >
                                {/* ADDED: hidden on xs, visible on sm+ */}
                                <span className={`text-md font-bold hidden sm:block max-w-[7rem] truncate ${isSolid ? 'text-gray-800' : 'text-white'}`}>
                                    {user.fullName || user.username}
                                </span>
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName || user.username}&background=2563eb&color=fff&bold=true`}
                                    alt="avatar"
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/50"
                                />
                                <ChevronDown size={14} className={`hidden sm:block ${isSolid ? 'text-gray-600' : 'text-white'}`} />
                            </button>

                            {/* Dropdown — ADDED: right-0, w-56 sm:w-62 to prevent overflow */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-3 w-56 sm:w-64 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-md font-bold text-gray-800 truncate">{user.fullName}</p>
                                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="p-2 flex flex-col">
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
                                            href="/profile"
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
                        <>
                            <Link href="/login" className={`px-3 py-2 text-sm font-bold rounded-md transition-all shadow-md hover:scale-105 ${isSolid
                                ? 'bg-gray-900 text-white hover:bg-black'
                                : 'bg-white text-gray-900 hover:bg-gray-200'
                                }`}>
                                Đăng nhập
                            </Link>
                            {/* ADDED: hidden on xs, show on sm+ */}
                            <Link href="/register" className={`hidden sm:block px-4 py-2 text-sm font-bold rounded-md transition-all shadow-md hover:scale-105 ${isSolid
                                ? 'bg-gray-900 text-white hover:bg-black'
                                : 'bg-white text-gray-900 hover:bg-gray-200'
                                }`}>
                                Đăng ký
                            </Link>
                        </>
                    )}

                    {/* Hamburger — ADDED: min touch target p-2.5 */}
                    <button
                        className={`md:hidden p-2.5 transition-colors ${isSolid ? 'text-gray-900' : 'text-white'} cursor-pointer`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu — ADDED: max-h + overflow-y-auto to handle long lists, better padding */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 absolute top-full left-0 w-full shadow-lg max-h-[80vh] overflow-y-auto">
                    {user && (
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName || user.username}&background=2563eb&color=fff&bold=true`}
                                alt="avatar"
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <p className="font-bold text-gray-800">{user.fullName}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    )}

                    {/* ADDED: consistent px-5 py-3 touch targets */}
                    <nav className="flex flex-col py-2">
                        <Link href="/" className="px-5 py-3.5 font-medium text-gray-800 hover:bg-gray-50 hover:text-blue-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                            Trang chủ
                        </Link>
                        <button
                            onClick={() => {
                                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                                setIsMobileMenuOpen(false);
                            }}
                            className="px-5 py-3.5 text-left font-medium text-gray-800 hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            Sản phẩm
                        </button>
                        <button
                            onClick={() => {
                                document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
                                setIsMobileMenuOpen(false);
                            }}
                            className="px-5 py-3.5 text-left font-medium text-gray-800 hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            Giới thiệu
                        </button>

                        {!user && (
                            <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-3 mt-1">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-center py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">
                                    Đăng nhập
                                </Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block text-center py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                                    Đăng ký
                                </Link>
                            </div>
                        )}

                        {user && (
                            <div className="border-t border-gray-100 mt-1">
                                {(user.role?.name === 'ADMIN' || user.role?.name === 'STAFF') && (
                                    <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3.5 font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                                        <LayoutDashboard size={18} /> Quản trị Admin
                                    </Link>
                                )}
                                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3.5 font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                                    <User size={18} /> Tài khoản của tôi
                                </Link>
                                <Link href="/setup-address" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-5 py-3.5 font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                                    <Settings size={18} /> Cài đặt & Địa chỉ
                                </Link>
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                                    className="flex items-center gap-3 px-5 py-3.5 w-full text-left font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                    <LogOut size={18} /> Đăng xuất
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;