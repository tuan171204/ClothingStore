'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/services/paymentService';
import { createOrder } from '@/services/orderService';
import Link from 'next/link';
import { useCart } from '@/context/CartContext'; // Import để xóa giỏ hàng

// Component con để xử lý logic (Bọc trong Suspense để tránh lỗi build Next.js)
const PaymentResultContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart } = useCart(); // Hàm xóa giỏ hàng từ Context (nếu có)

    const [status, setStatus] = useState({ loading: true, success: false, message: 'Đang xử lý...' });

    useEffect(() => {
        const processPayment = async () => {
            // Check tham số URL
            if (!searchParams.get('vnp_ResponseCode')) {
                setStatus({ loading: false, success: false, message: 'Thông tin không hợp lệ.' });
                return;
            }

            try {
                // 1. Convert URL params & Verify
                const params = {};
                searchParams.forEach((value, key) => params[key] = value);
                const res = await verifyPayment(params);

                // 2. Nếu thanh toán thành công (Code 00)
                if (res.code === '00') {

                    // --- LOGIC MỚI: TẠO ĐƠN HÀNG ---
                    const pendingOrderStr = localStorage.getItem("PENDING_ORDER");

                    if (pendingOrderStr) {
                        const orderData = JSON.parse(pendingOrderStr);

                        // Gọi API lưu đơn xuống Database
                        await createOrder(orderData);

                        // Dọn dẹp
                        localStorage.removeItem("PENDING_ORDER");
                        clearCart();

                        setStatus({
                            loading: false,
                            success: true,
                            message: 'Thanh toán và Tạo đơn hàng thành công!'
                        });
                    } else {
                        // Trường hợp hiếm: Mất localStorage (đổi thiết bị, ẩn danh...)
                        setStatus({
                            loading: false,
                            success: true,
                            message: 'Thanh toán thành công, nhưng không tìm thấy thông tin đơn hàng tạm (Vui lòng liên hệ Admin).'
                        });
                    }

                } else {
                    // Thanh toán thất bại/hủy
                    setStatus({ loading: false, success: false, message: 'Giao dịch thất bại hoặc đã bị hủy.' });
                }
            } catch (error) {
                console.error(error);
                setStatus({ loading: false, success: false, message: 'Có lỗi xảy ra khi xử lý.' });
            }
        };

        processPayment();
    }, []);

    // GIAO DIỆN
    if (status.loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Đang xác thực giao dịch...</h2>
                <p className="text-gray-500">Vui lòng không tắt trình duyệt</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center mt-10">
            {status.success ? (
                // --- TRƯỜNG HỢP THÀNH CÔNG ---
                <div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h2>
                    <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua hàng tại cửa hàng.</p>
                    <Link href="/">
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
                            Tiếp tục mua sắm
                        </button>
                    </Link>
                </div>
            ) : (
                // --- TRƯỜNG HỢP THẤT BẠI ---
                <div>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h2>
                    <p className="text-red-500 mb-6">{status.message}</p>
                    <div className="flex gap-4">
                        <Link href="/checkout" className="flex-1">
                            <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition">
                                Thử lại
                            </button>
                        </Link>
                        <Link href="/" className="flex-1">
                            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
                                Về trang chủ
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Page Component
export default function PaymentResultPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <Suspense fallback={<div>Đang tải...</div>}>
                <PaymentResultContent />
            </Suspense>
        </div>
    );
}