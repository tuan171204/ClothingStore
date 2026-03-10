'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, AlertCircle, UserCheck } from 'lucide-react';
import { addressService } from '@/services/addressService';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Chuyển hướng dựa theo Role cơ bản
        try {
            const user = await login(username, password);
            console.log(user);
            if (user?.role?.name === 'ADMIN' || user?.role?.name === 'STAFF') {
                router.push('/admin/dashboard');
            } else {
                // LÀ KHÁCH HÀNG -> Kiểm tra xem đã có địa chỉ mặc định chưa
                try {
                    const addressRes = await addressService.getMyDefaultAddress();

                    if (addressRes.result === null) {
                        // Chưa có địa chỉ -> Bắt qua trang Setup
                        router.push('/setup-address');
                    } else {
                        // Có rồi -> Về trang chủ mua sắm
                        router.push('/');
                    }
                } catch (addrErr) {
                    console.error("Lỗi check address", addrErr);
                    router.push('/'); // Fallback an toàn nếu API lỗi
                }
            }
        } catch (err) {
            setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden">

            {/* Định nghĩa Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes blurFadeIn {
                    0% { opacity: 0; filter: blur(20px); transform: scale(1.05); }
                    100% { opacity: 1; filter: blur(0); transform: scale(1); }
                }
                @keyframes slideUpFade {
                    0% { opacity: 0; transform: translateY(40px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .anim-bg {
                    animation: blurFadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .anim-slide-up {
                    opacity: 0; 
                    animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
                .delay-400 { animation-delay: 400ms; }
            `}} />

            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center anim-bg"
                ></div>
                {/* Lớp phủ đen đậm hơn một chút để text trắng nổi bật */}
                <div className="absolute inset-0 bg-black/60 anim-bg"></div>
            </div>

            {/* Form Đăng nhập Glassmorphism tối */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-2xl rounded-4xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] p-8 sm:p-12 0 anim-slide-up">

                {/* Header Form */}
                <div className="mb-10 text-center anim-slide-up delay-100">
                    <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">Đăng nhập</h2>
                    <p className="text-gray-300 font-medium">Chào mừng bạn quay trở lại với ClothStore</p>
                </div>

                {/* Thông báo lỗi (Glass style) */}
                {error && (
                    <div className="bg-red-500/20 backdrop-blur-md text-red-100 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 border border-red-500/30 anim-slide-up delay-100 shadow-lg">
                        <AlertCircle size={18} className="shrink-0 text-red-400" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Input Username */}
                    <div className="space-y-2 anim-slide-up delay-200">
                        <label className="text-sm font-bold text-gray-200 block ml-1">
                            Tên đăng nhập
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all bg-white/5 focus:bg-white/10 text-white font-medium placeholder-white/40 shadow-inner"
                                placeholder="Nhập tên đăng nhập"
                                required
                            />
                        </div>
                    </div>

                    {/* Input Password */}
                    <div className="space-y-2 anim-slide-up delay-300">
                        <label className="text-sm font-bold text-gray-200 block ml-1">
                            Mật khẩu
                        </label>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all bg-white/5 focus:bg-white/10 text-white font-medium placeholder-white/40 shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {/* Nút quên mật khẩu */}
                        <div className="flex justify-end mt-4">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-gray-300 hover:text-white font-bold transition-colors"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                    </div>

                    {/* Nút Submit */}
                    <div className="anim-slide-up delay-400 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-gray-900 font-bold tracking-wide py-4 px-4 rounded-md hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] focus:ring-4 focus:ring-white/50 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                                    <span>ĐANG XỬ LÝ...</span>
                                </div>
                            ) : (
                                'ĐĂNG NHẬP'
                            )}
                        </button>
                    </div>


                    <div className="anim-slide-up delay-400">
                        <button
                            type="button"
                            disabled={isLoading}
                            className="w-full bg-purple-600 text-white font-bold tracking-wide py-4 px-4 rounded-md hover:bg-purple-900 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] focus:ring-4 focus:ring-white/50 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex gap-3 justify-center items-center cursor-pointer uppercase"
                        >
                            <UserCheck size={22} />
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                                    <span>ĐANG XỬ LÝ...</span>
                                </div>
                            ) : (
                                `Tiếp tục với Google`
                            )}
                        </button>
                    </div>





                </form>

                {/* Phần chuyển hướng sang Đăng ký */}
                <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-300 text-sm font-medium anim-slide-up delay-400">
                    Chưa có tài khoản?{' '}
                    <Link href="/register" className="text-white font-bold hover:underline transition-all">
                        Đăng ký ngay
                    </Link>
                </div>
            </div>
        </div>
    );
}