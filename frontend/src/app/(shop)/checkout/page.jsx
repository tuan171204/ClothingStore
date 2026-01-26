'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/services/productService';
import {
    calculateShippingFee,
    getProvinces,
    getDistricts,
    getWards
} from '@/services/shippingService';
import { createPaymentUrl } from '@/services/paymentService'; // Service VNPay cũ
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const router = useRouter();

    // --- State cho Địa chỉ ---
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');

    // --- State Đơn hàng ---
    const [shippingMethod, setShippingMethod] = useState('GHN');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [shippingFee, setShippingFee] = useState(0);
    const [loadingFee, setLoadingFee] = useState(false);

    const finalTotal = cartTotal + shippingFee;

    // 1. Load danh sách Tỉnh khi vào trang
    useEffect(() => {
        getProvinces().then(data => setProvinces(data));
    }, []);

    // 2. Xử lý khi chọn Tỉnh -> Load Huyện
    const handleProvinceChange = async (e) => {
        const provinceId = Number(e.target.value);
        setSelectedProvince(provinceId);

        // Reset cấp dưới
        setDistricts([]);
        setWards([]);
        setSelectedDistrict('');
        setSelectedWard('');
        setShippingFee(0);

        if (provinceId) {
            const data = await getDistricts(provinceId);
            setDistricts(data);
        }
    };

    // 3. Xử lý khi chọn Huyện -> Load Xã
    const handleDistrictChange = async (e) => {
        const districtId = Number(e.target.value);
        setSelectedDistrict(districtId);

        // Reset cấp dưới
        setWards([]);
        setSelectedWard('');
        setShippingFee(0);

        if (districtId) {
            const data = await getWards(districtId);
            setWards(data);
        }
    };

    // 4. Xử lý khi chọn Xã -> TÍNH PHÍ SHIP
    const handleWardChange = async (e) => {
        const wardCode = e.target.value;
        setSelectedWard(wardCode);

        if (wardCode && selectedDistrict) {
            setLoadingFee(true);
            try {
                // Gọi API tính phí với DistrictID và WardCode thực tế
                const fee = await calculateShippingFee(selectedDistrict, wardCode);
                setShippingFee(fee);
            } catch (err) {
                console.error(err);
                setShippingFee(0);
            } finally {
                setLoadingFee(false);
            }
        }
    };

    // 5. Xử lý Đặt hàng
    const handlePlaceOrder = async () => {
        // Validate chọn địa chỉ
        if (!selectedProvince || !selectedDistrict || !selectedWard) {
            alert("Vui lòng chọn đầy đủ địa chỉ giao hàng!");
            return;
        }

        if (cartItems.length === 0) {
            alert("Giỏ hàng trống!");
            return;
        }

        if (paymentMethod === 'VNPAY') {
            try {
                const paymentUrl = await createPaymentUrl(finalTotal);
                window.location.href = paymentUrl;
            } catch (error) {
                alert("Lỗi tạo thanh toán VNPay");
            }
        } else {
            alert(`Đặt hàng COD thành công! Phí ship: ${formatCurrency(shippingFee)}`);
            clearCart();
            router.push('/');
        }
    };


    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Giỏ hàng trống</h2>
                    <Link href="/" className="text-blue-600 hover:underline">Quay lại mua sắm</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- CỘT TRÁI: THÔNG TIN & TÙY CHỌN --- */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Thông tin giao hàng (Form giả lập) */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Thông tin giao hàng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Họ và tên" className="border p-3 rounded w-full" />
                            <input type="text" placeholder="Số điện thoại" className="border p-3 rounded w-full" />
                            <input type="email" placeholder="Email" className="border p-3 rounded w-full md:col-span-2" />
                            <input type="text" placeholder="Địa chỉ cụ thể (Số nhà, đường...)" className="border p-3 rounded w-full md:col-span-2" />

                            {/* --- 3 DROPDOWN ĐỊA CHỈ (DYNAMIC) --- */}

                            {/* 1. Chọn Tỉnh */}
                            <select
                                className="border p-3 rounded w-full"
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                            >
                                <option value="">-- Chọn Tỉnh/Thành --</option>
                                {provinces.map(p => (
                                    <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                                ))}
                            </select>

                            {/* 2. Chọn Huyện */}
                            <select
                                className="border p-3 rounded w-full"
                                value={selectedDistrict}
                                onChange={handleDistrictChange}
                                disabled={!selectedProvince}
                            >
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {districts.map(d => (
                                    <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                                ))}
                            </select>

                            {/* 3. Chọn Xã */}
                            <select
                                className="border p-3 rounded w-full md:col-span-2"
                                value={selectedWard}
                                onChange={handleWardChange}
                                disabled={!selectedDistrict}
                            >
                                <option value="">-- Chọn Phường/Xã --</option>
                                {wards.map(w => (
                                    <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 2. Phương thức vận chuyển */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Đơn vị vận chuyển</h3>
                        <div className="space-y-3">
                            {/* Option GHN */}
                            <label className={`flex items-center justify-between border p-4 rounded-lg cursor-pointer transition
                                ${shippingMethod === 'GHN' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-gray-300'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="shipping"
                                        value="GHN"
                                        checked={shippingMethod === 'GHN'}
                                        onChange={(e) => setShippingMethod(e.target.value)}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    <div>
                                        <span className="font-bold text-gray-800">Giao Hàng Nhanh (GHN)</span>
                                        <p className="text-xs text-gray-500">Vận chuyển tiêu chuẩn</p>
                                    </div>
                                </div>
                                <span className="font-bold text-blue-600">
                                    {loadingFee ? 'Đang tính...' : formatCurrency(shippingFee)}
                                </span>
                            </label>

                            {/* Option GHTK (Disabled) */}
                            <label className="flex items-center justify-between border p-4 rounded-lg cursor-not-allowed opacity-60 bg-gray-100">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="shipping"
                                        value="GHTK"
                                        disabled
                                        className="w-5 h-5"
                                    />
                                    <div>
                                        <span className="font-bold text-gray-800">Giao Hàng Tiết Kiệm</span>
                                        <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-500">Đang phát triển</span>
                                    </div>
                                </div>
                                <span>--</span>
                            </label>
                        </div>
                    </div>

                    {/* 3. Phương thức thanh toán */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Phương thức thanh toán</h3>
                        <div className="space-y-3">
                            {/* COD */}
                            <label className={`flex items-center gap-3 border p-4 rounded-lg cursor-pointer transition
                                ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-blue-600"
                                />
                                <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                            </label>

                            {/* VNPay */}
                            <label className={`flex items-center gap-3 border p-4 rounded-lg cursor-pointer transition
                                ${paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="VNPAY"
                                    checked={paymentMethod === 'VNPAY'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-5 h-5 text-blue-600"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Thanh toán qua VNPay</span>
                                    <img src="/vnpay-logo.png" alt="VNPay" className="h-6 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: TỔNG KẾT --- */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">Đơn hàng</h3>

                        <div className="space-y-2 text-gray-600">
                            <div className="flex justify-between">
                                <span>Tạm tính:</span>
                                <span>{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Phí vận chuyển:</span>
                                <span className="font-medium text-blue-600">
                                    {loadingFee ? '...' : formatCurrency(shippingFee)}
                                </span>
                            </div>
                        </div>

                        <hr className="border-gray-100 my-4" />

                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg text-gray-800">Tổng cộng:</span>
                            <span className="font-bold text-2xl text-red-600">
                                {loadingFee ? '...' : formatCurrency(finalTotal)}
                            </span>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loadingFee}
                            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {paymentMethod === 'VNPAY' ? 'Thanh toán VNPay' : 'Đặt hàng'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}