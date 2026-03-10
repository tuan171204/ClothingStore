'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (!token) {
            setMessage('Đường dẫn không hợp lệ hoặc thiếu Token.');
            setIsError(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage('Mật khẩu xác nhận không khớp.');
            setIsError(true);
            return;
        }

        setLoading(true);
        try {
            const result = await authService.resetPassword(token, newPassword);

            setMessage('Mật khẩu đã được thiết lập lại thành công.');
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error) {
            setMessage(error.message || 'Có lỗi xảy ra, token có thể đã hết hạn.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
            <div className="w-full max-w-md p-10 bg-white border border-gray-200 shadow-sm rounded-none">

                <h2 className="text-center text-xl font-medium tracking-widest uppercase text-black mb-8">
                    Khôi phục mật khẩu
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Input Mật khẩu mới */}
                    <div>
                        <label className="block text-sm font-semibold tracking-wider text-gray-500 mb-2 uppercase">
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu mới của bạn"
                            className="w-full px-4 py-3 border border-black rounded-none outline-none text-md bg-white text-black transition-colors focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400"
                        />
                    </div>

                    {/* Input Xác nhận mật khẩu */}
                    <div>
                        <label className="block text-sm font-semibold tracking-wider text-gray-500 mb-2 uppercase">
                            Xác nhận mật khẩu
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Nhập lại mật khẩu"
                            className="w-full px-4 py-3 border border-black rounded-none outline-none text-md bg-white text-black transition-colors focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400"
                        />
                    </div>

                    {/* Nút Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-4 bg-black text-white border border-black rounded-none text-md font-semibold tracking-widest uppercase cursor-pointer transition-colors hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận thay đổi'}
                    </button>
                </form>

                {/* Thông báo (Message Box) */}
                {message && (
                    <div className={`mt-6 p-3 text-md text-center font-medium tracking-wide border rounded-none
            ${isError
                            ? 'bg-white text-black border-black' // Lỗi: Nền trắng, viền đen, chữ đen
                            : 'bg-black text-white border-black' // Thành công: Nền đen, chữ trắng
                        }`}
                    >
                        {message}
                    </div>
                )}

            </div>
        </div>
    );
}

// Bọc Component bằng Suspense
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black tracking-widest text-md uppercase">
                Đang tải...
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}