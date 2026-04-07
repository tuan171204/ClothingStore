'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { User, Lock, Mail, Phone, Calendar, Type, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
// Import Swiper React components và styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';

export default function RegisterPage() {
    const router = useRouter();
    const { loginWithGoogleToken } = useAuth();

    // Danh sách các Slide (Ảnh hoặc Video) - Bạn có thể thay đổi link tùy ý
    const slides = [
        {
            type: 'image',
            src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop'
        },
        {
            type: 'video',
            src: 'https://cdn.pixabay.com/video/2023/10/19/185726-876137967_large.mp4',
            poster: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop'
        },
        {
            type: 'image',
            src: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop'
        },
    ];

    // Gom các trường dữ liệu vào 1 object cho gọn
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        email: '',
        dob: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            // Gọi API đăng ký
            await authService.register(formData);

            setSuccess('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');

            // Tự động chuyển về trang login sau 2 giây
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err) {
            // Hiển thị lỗi từ backend (ví dụ: Username hoặc Email đã tồn tại)
            setError(err.message || 'Có lỗi xảy ra trong quá trình đăng ký!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full font-sans overflow-hidden bg-white">

            {/* Cột trái: Form đăng ký (Có thể cuộn dọc nếu màn hình nhỏ) */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto flex items-center justify-center p-6 sm:p-10 lg:p-16 scrollbar-hide bg-white relative z-10">
                <div className="w-full max-w-xl my-auto">

                    {/* Header Form */}
                    <div className="mb-8 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản mới</h2>
                        <p className="text-gray-500">Điền thông tin bên dưới để gia nhập cùng ClothStore</p>
                    </div>

                    {/* Thông báo Lỗi */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 border border-red-100">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Thông báo Thành công */}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 border border-green-100">
                            <CheckCircle2 size={18} className="shrink-0" />
                            <span className="font-medium">{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                            {/* Họ và tên */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block">Họ và tên</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Type size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text" name="fullName" required
                                        value={formData.fullName} onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                            </div>

                            {/* Số điện thoại */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block">Số điện thoại</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Phone size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="tel" name="phoneNumber" required
                                        value={formData.phoneNumber} onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900"
                                        placeholder="0912345678"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 block">Địa chỉ Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email" name="email" required
                                        value={formData.email} onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            {/* Tên đăng nhập */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block">Tên đăng nhập</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text" name="username" required
                                        value={formData.username} onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900"
                                        placeholder="Nhập username"
                                    />
                                </div>
                            </div>

                            {/* Ngày sinh */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block">Ngày sinh</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Calendar size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="date" name="dob" required
                                        value={formData.dob} onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900 text-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Mật khẩu */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 block">Mật khẩu</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="password" name="password" required minLength="6"
                                        value={formData.password} onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900"
                                        placeholder="Tạo mật khẩu (Ít nhất 6 ký tự)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nút Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="cursor-pointer w-full bg-gray-700 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-gray-900 focus:ring-4 focus:ring-gray-900/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-8"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>ĐANG XỬ LÝ...</span>
                                </div>
                            ) : (
                                'TẠO TÀI KHOẢN'
                            )}
                        </button>

                        {/* Dải phân cách */}
                        <div className="flex items-center my-6 mt-8">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="px-4 text-gray-400 text-sm font-medium">Hoặc</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <div className="mt-4 flex justify-center w-full">
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    try {
                                        setIsLoading(true);
                                        setError('');
                                        await loginWithGoogleToken(credentialResponse.credential);
                                        router.push('/');
                                    } catch (err) {
                                        setError(err.message || 'Xác thực Google thất bại!');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                onError={() => {
                                    setError('Lỗi kết nối đến Google Server');
                                }}
                                useOneTap
                                theme="outline"
                                shape="rectangular"
                                size="large"
                                width="400"
                                text="signup_with"
                            />
                        </div>
                    </form>

                    {/* Điều hướng về Đăng nhập */}
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center text-gray-600 text-sm">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="text-gray-800 font-semibold hover:text-blue-700 transition-colors">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>

            {/* Cột phải: Slider Ảnh/Video (Cố định, không cuộn) */}
            <div className="hidden md:flex md:w-1/2 relative items-center justify-center bg-zinc-900 h-full overflow-hidden">

                {/* Swiper Slider Component */}
                <Swiper
                    modules={[Autoplay, EffectFade]}
                    effect={'fade'}
                    spaceBetween={0}
                    slidesPerView={1}
                    loop={true}
                    autoplay={{
                        delay: 2300, // Thời gian chuyển slide (ms)
                        disableOnInteraction: false,
                    }}
                    allowTouchMove={false} // Tắt tính năng vuốt để slider chỉ tự động chạy
                    className="h-full w-full absolute inset-0"
                >
                    {slides.map((slide, index) => (
                        <SwiperSlide key={index} className="h-full w-full relative">
                            {slide.type === 'video' ? (
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    poster={slide.poster}
                                    className="h-full w-full object-cover"
                                >
                                    <source src={slide.src} type="video/mp4" />
                                    Trình duyệt của bạn không hỗ trợ thẻ video.
                                </video>
                            ) : (
                                <div
                                    className="h-full w-full bg-cover bg-center transition-transform duration-[3000] scale-105 hover:scale-100"
                                    style={{ backgroundImage: `url('${slide.src}')` }}
                                ></div>
                            )}
                            {/* Lớp phủ màu tối để text dễ đọc */}
                            <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Gradient overlay tổng thể */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none"></div>


            </div>
        </div>
    );
}