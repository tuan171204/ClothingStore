'use client';
import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react'; // Nếu bạn đã cài lucide-react

export default function OrderSuccessPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full animate-fade-in-up">
                {/* Icon Thành công */}
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
                <p className="text-gray-500 mb-8">
                    Cảm ơn bạn đã mua sắm tại ClothStore. <br />
                    Chúng tôi sẽ sớm liên hệ để xác nhận đơn hàng.
                </p>

                <div className="space-y-3 flex flex-col gap-1.5">
                    <Link href="/">
                        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 cursor-pointer">
                            Tiếp tục mua sắm
                        </button>
                    </Link>

                    {/* <Link href="/products">
                        <button className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition cursor-pointer">
                            Xem sản phẩm khác
                        </button>
                    </Link> */}
                </div>
            </div>

            <p className="mt-8 text-sm text-gray-400">
                Cần hỗ trợ? Liên hệ <a href="tel:19001000" className="text-blue-500 hover:underline">1900 1000</a>
            </p>
        </div>
    );
}