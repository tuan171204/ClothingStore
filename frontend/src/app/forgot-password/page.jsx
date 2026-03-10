'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { authService } from '@/services/authService';

function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await authService.forgotPassword(email);
            setStatus('success');
            setMessage('Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).');
        } catch (error) {
            setStatus('error');
            setMessage(error.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại email.');
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center anim-fade-in">
                <div className="flex justify-center mb-6">
                    <CheckCircle size={60} className="text-black" />
                </div>
                <h2 className="text-xl font-medium tracking-widest uppercase mb-4">Kiểm tra Email</h2>
                <p className="text-gray-500 text-md leading-relaxed mb-8">
                    {message}
                </p>
                <Link
                    href="/login"
                    className="inline-block border border-black px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300"
                >
                    Quay lại đăng nhập
                </Link>
            </div>
        );
    }

    return (
        <div className="anim-fade-in">
            <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-8 text-sm font-bold tracking-widest uppercase">
                <ArrowLeft size={16} />
                Quay lại
            </Link>

            <h2 className="text-xl font-medium tracking-widest uppercase text-black mb-4">
                Quên mật khẩu?
            </h2>
            <p className="text-gray-500 text-md mb-8 leading-relaxed">
                Nhập địa chỉ email gắn liền với tài khoản của bạn. Chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-semibold tracking-wider text-gray-500 mb-2 uppercase">
                        Địa chỉ Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="email@vi-du.com"
                            className="w-full pl-12 pr-4 py-4 border border-black rounded-none outline-none text-md bg-white text-black focus:ring-1 focus:ring-black placeholder-gray-300"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="cursor-pointer w-full py-4 bg-black text-white border border-black rounded-none text-md font-semibold tracking-widest uppercase hover:bg-gray-800 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                >
                    {status === 'loading' ? 'Đang xử lý...' : 'Gửi liên kết phục hồi'}
                </button>
            </form>

            {status === 'error' && (
                <div className="mt-6 p-4 border border-black text-md text-center font-medium tracking-wide">
                    {message}
                </div>
            )}
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md p-10 bg-white border border-gray-100 shadow-sm">
                <Suspense fallback={<div className="text-center tracking-widest text-sm uppercase">Đang tải...</div>}>
                    <ForgotPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}