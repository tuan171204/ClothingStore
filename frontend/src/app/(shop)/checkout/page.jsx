"use client";
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { createPaymentUrl } from '@/services/paymentService'; // Import service vừa tạo
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
    const { cartTotal, cartItems } = useCart();
    const router = useRouter();

    // State lưu phương thức thanh toán
    const [paymentMethod, setPaymentMethod] = useState('COD'); // Mặc định là COD
    const [loading, setLoading] = useState(false);

    // Giả lập phí ship (sau này lấy từ GHTK)
    const shippingFee = 30000;
    const finalTotal = cartTotal + shippingFee;

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            if (paymentMethod === 'VNPAY') {
                // 1. Gọi API lấy link thanh toán
                const paymentUrl = await createPaymentUrl(finalTotal);

                // 2. Chuyển hướng người dùng sang VNPay
                window.location.href = paymentUrl;
            } else {
                // Xử lý COD (Gọi API tạo đơn hàng bình thường - chưa làm)
                alert("Đặt hàng COD thành công (Demo)");
                router.push('/order-success');
            }
        } catch (error) {
            alert("Có lỗi xảy ra khi tạo thanh toán");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

            <div className="flex gap-8">
                {/* Cột trái: Form thông tin (Bạn tự code form nhé) */}
                <div className="flex-1">
                    {/* ... Form địa chỉ ... */}

                    {/* Phần chọn phương thức thanh toán */}
                    <div className="mt-6 bg-white p-4 rounded shadow">
                        <h3 className="font-bold mb-4">Phương thức thanh toán</h3>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <span>Thanh toán khi nhận hàng (COD)</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="VNPAY"
                                    checked={paymentMethod === 'VNPAY'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                    <span>Thanh toán qua VNPay</span>
                                    <img src="https://vnpay.vn/assets/images/logo-icon/logo-primary.svg" alt="VNPay" className="h-6" />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Tổng tiền */}
                <div className="w-96 bg-gray-50 p-6 rounded h-fit">
                    <div className="flex justify-between mb-2">
                        <span>Tiền hàng:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(cartTotal)} đ</span>
                    </div>
                    <div className="flex justify-between mb-4">
                        <span>Phí vận chuyển:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(shippingFee)} đ</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between font-bold text-xl text-red-600 mb-6">
                        <span>Tổng cộng:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(finalTotal)} đ</span>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
                    </button>
                </div>
            </div>
        </div>
    );
}