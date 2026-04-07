'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/services/productService';
import { calculateShippingFee, getProvinces, getDistricts, getWards } from '@/services/shippingService';
import { createPaymentUrl } from '@/services/paymentService';
import { createOrder } from '@/services/orderService';
import { addressService } from '@/services/addressService';
import { checkoutService } from '@/services/checkoutService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, User, Phone, CheckCircle2, Plus, TicketPercent } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CheckoutPage() {
    const { cartItems, cartTotal, clearCart, validateCart } = useCart();
    const router = useRouter();

    // --- State SỔ ĐỊA CHỈ ---
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new'); // id của address hoặc 'new' để tự nhập
    const [isFetchingAddress, setIsFetchingAddress] = useState(true);

    // --- Thông tin người mua (CHO TRƯỜNG HỢP TỰ NHẬP MỚI) ---
    const [formData, setFormData] = useState({ fullName: '', phone: '', specificAddress: '' });
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');

    // --- State Đơn hàng ---
    const [shippingMethod, setShippingMethod] = useState('GHN');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCouponCode, setAppliedCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [shippingFee, setShippingFee] = useState(0);
    const [loadingFee, setLoadingFee] = useState(false);

    const [stockMismatches, setStockMismatches] = useState([]);
    const [checkoutError, setCheckoutError] = useState(null);

    const finalTotal = Math.max(0, cartTotal + shippingFee - couponDiscount);

    // 1. Khởi tạo dữ liệu
    useEffect(() => {
        const initData = async () => {
            setIsFetchingAddress(true);
            try {
                const provData = await getProvinces();
                setProvinces(provData);

                // Lấy TẤT CẢ địa chỉ
                const addressRes = await addressService.getAllMyAddresses();
                if (addressRes.result && addressRes.result.length > 0) {
                    setSavedAddresses(addressRes.result);
                    // Tìm địa chỉ mặc định để chọn sẵn
                    const defaultAddr = addressRes.result.find(a => a.default) || addressRes.result[0];
                    setSelectedAddressId(defaultAddr.id);
                    calculateFeeForAddress(defaultAddr.districtId, defaultAddr.wardCode);
                } else {
                    setSelectedAddressId('new');
                }
            } catch (error) {
                console.error("Lỗi load checkout:", error);
                setSelectedAddressId('new');
            } finally {
                setIsFetchingAddress(false);
            }
        };
        initData();
    }, []);

    // 2. Tính phí Ship
    const calculateFeeForAddress = async (dId, wCode) => {
        if (!dId || !wCode) return setShippingFee(0);
        setLoadingFee(true);
        try {
            const fee = await calculateShippingFee(dId, wCode);
            setShippingFee(fee);
        } catch (err) {
            setShippingFee(0);
        } finally {
            setLoadingFee(false);
        }
    };

    // Khi người dùng đổi địa chỉ trong danh sách
    const handleSelectAddress = (id) => {
        setSelectedAddressId(id);
        if (id === 'new') {
            if (selectedDistrict && selectedWard) calculateFeeForAddress(selectedDistrict, selectedWard);
            else setShippingFee(0);
        } else {
            const addr = savedAddresses.find(a => a.id === id);
            if (addr) calculateFeeForAddress(addr.districtId, addr.wardCode);
        }
    };

    // --- XỬ LÝ DROPDOWN TỰ NHẬP ---
    const handleProvinceChange = async (e) => {
        const provinceId = Number(e.target.value);
        setSelectedProvince(provinceId);
        setDistricts([]); setWards([]); setSelectedDistrict(''); setSelectedWard(''); setShippingFee(0);
        if (provinceId) setDistricts(await getDistricts(provinceId));
    };

    const handleDistrictChange = async (e) => {
        const districtId = Number(e.target.value);
        setSelectedDistrict(districtId);
        setWards([]); setSelectedWard(''); setShippingFee(0);
        if (districtId) setWards(await getWards(districtId));
    };

    const handleWardChange = async (e) => {
        const wardCode = e.target.value;
        setSelectedWard(wardCode);
        if (wardCode && selectedDistrict) calculateFeeForAddress(selectedDistrict, wardCode);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyCoupon = async () => {
        const normalizedCode = couponCode.trim().toUpperCase();
        if (!normalizedCode) {
            toast.warn('Vui lòng nhập mã khuyến mãi');
            return;
        }

        setApplyingCoupon(true);
        try {
            const previewPayload = {
                shippingFee,
                couponCode: normalizedCode,
                items: cartItems.map(item => ({
                    skuId: item.skuId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };

            const result = await checkoutService.previewCheckout(previewPayload);
            const discount = Number(result?.discountAmount || 0);
            setCouponDiscount(discount);
            setAppliedCouponCode(result?.appliedCouponCode || normalizedCode);
            toast.success(`Áp dụng mã thành công: -${formatCurrency(discount)}`);
        } catch (error) {
            setCouponDiscount(0);
            setAppliedCouponCode('');
            toast.error(error.response?.data?.message || 'Mã khuyến mãi không hợp lệ');
        } finally {
            setApplyingCoupon(false);
        }
    };

    const findName = (list, idKey, idVal, nameKey) => {
        const found = list.find(item => item[idKey] == idVal);
        return found ? found[nameKey] : '';
    };

    // --- ĐẶT HÀNG ---
    const handlePlaceOrder = async () => {
        setStockMismatches([]);
        setCheckoutError(null);
        setLoadingFee(true);

        if (cartItems.length === 0) return alert("Giỏ hàng trống!");

        let finalOrderData = {};

        if (selectedAddressId !== 'new') {
            const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
            if (!selectedAddr) return alert("Lỗi chọn địa chỉ!");

            finalOrderData = {
                fullName: selectedAddr.receiverName,
                phoneNumber: selectedAddr.phone,
                address: `${selectedAddr.streetAddress}, ${selectedAddr.wardName}, ${selectedAddr.districtName}, ${selectedAddr.provinceName}`,
                toProvinceId: selectedAddr.provinceId,
                toDistrictId: selectedAddr.districtId,
                toWardCode: selectedAddr.wardCode,
                shippingFee: shippingFee,
                paymentMethod: paymentMethod,
                couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
                items: cartItems.map(item => ({ skuId: item.skuId, productName: item.productName, quantity: item.quantity, price: item.price }))
            };
        } else {
            if (!formData.fullName || !formData.phone || !formData.specificAddress || !selectedProvince || !selectedDistrict || !selectedWard) {
                return alert("Vui lòng điền đầy đủ thông tin giao hàng!");
            }
            const fullAddress = `${formData.specificAddress}, ${findName(wards, 'WardCode', selectedWard, 'WardName')}, ${findName(districts, 'DistrictID', selectedDistrict, 'DistrictName')}, ${findName(provinces, 'ProvinceID', selectedProvince, 'ProvinceName')}`;

            finalOrderData = {
                fullName: formData.fullName,
                phoneNumber: formData.phone,
                address: fullAddress,
                toProvinceId: Number(selectedProvince),
                toDistrictId: Number(selectedDistrict),
                toWardCode: String(selectedWard),
                shippingFee: shippingFee,
                paymentMethod: paymentMethod,
                couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
                items: cartItems.map(item => ({ skuId: item.skuId, productName: item.productName, quantity: item.quantity, price: item.price }))
            };
        }

        setLoadingFee(true);
        try {
            const result = await checkoutService.checkout(finalOrderData);

            if (result.status === 'SUCCESS') {
                if (paymentMethod === 'VNPAY') {
                    window.location.href = await createPaymentUrl(
                        result.totalAmount, result.orderId
                    );
                } else {
                    clearCart();
                    router.push('/order-success');
                }
            }
        } catch (error) {
            const responseData = error.response?.data?.result;

            if (responseData?.status === 'OUT_OF_STOCK'
                || responseData?.status === 'PARTIAL_AVAILABLE') {
                // Backend trả về structured mismatch data
                setStockMismatches(responseData.stockMismatches || []);
                setCheckoutError(responseData.message);

                // Sync lại cart
                await validateCart();
                toast.warn("Giỏ hàng đã được cập nhật theo tồn kho mới nhất");
            } else {
                toast.error(error.response?.data?.message || "Lỗi đặt hàng");
            }
        } finally {
            setLoadingFee(false);
        }
    };

    if (cartItems.length === 0) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Link href="/" className="text-blue-600 font-bold hover:underline">Quay lại mua sắm</Link></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-10 font-sans">
            {stockMismatches.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-red-500" />
                        <p className="font-bold text-red-800">Không thể đặt hàng</p>
                    </div>
                    <ul className="space-y-2">
                        {stockMismatches.map(m => (
                            <li key={m.skuId} className="text-sm text-red-700 
                                              flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                {m.userMessage}
                                {m.canPartialFulfill && (
                                    <span className="text-gray-500 ml-1">
                                        (Bạn có thể đặt {m.availableQuantity} sản phẩm)
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- CỘT TRÁI --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 uppercase tracking-tight">
                            <MapPin className="text-blue-600" /> Thông tin nhận hàng
                        </h3>

                        {isFetchingAddress ? (
                            <div className="py-8 text-center text-gray-500 text-sm">Đang tải sổ địa chỉ...</div>
                        ) : (
                            <div className="space-y-4">
                                {/* DANH SÁCH ĐỊA CHỈ ĐÃ LƯU */}
                                {savedAddresses.map(addr => (
                                    <label key={addr.id} className={`flex gap-4 p-5 rounded-md border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                                        <input
                                            type="radio" name="addressSelect"
                                            checked={selectedAddressId === addr.id}
                                            onChange={() => handleSelectAddress(addr.id)}
                                            className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div className="flex-1 space-y-1 text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-base text-gray-900">{addr.receiverName}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-gray-600 font-medium">{addr.phone}</span>
                                                {addr.default && (
                                                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded">
                                                        <CheckCircle2 size={12} /> Mặc định
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600">{addr.streetAddress}</p>
                                            <p className="text-gray-600">{addr.wardName}, {addr.districtName}, {addr.provinceName}</p>
                                        </div>
                                    </label>
                                ))}

                                {/* TÙY CHỌN: NHẬP ĐỊA CHỈ KHÁC */}
                                <label className={`flex gap-4 p-5 rounded-md border-2 cursor-pointer transition-all ${selectedAddressId === 'new' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'}`}>
                                    <input
                                        type="radio" name="addressSelect"
                                        checked={selectedAddressId === 'new'}
                                        onChange={() => handleSelectAddress('new')}
                                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center gap-2 font-bold text-gray-900">
                                            <Plus size={18} /> Giao đến địa chỉ khác
                                        </div>

                                        {/* FORM HIỆN RA KHI CHỌN 'NEW' */}
                                        {selectedAddressId === 'new' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 animate-fade-in text-sm">
                                                <input type="text" name="fullName" placeholder="Họ và tên người nhận" value={formData.fullName} onChange={handleInputChange} className="border border-gray-300 p-3 rounded-md w-full focus:ring-1 focus:ring-gray-900 outline-none bg-white" />
                                                <input type="text" name="phone" placeholder="Số điện thoại" value={formData.phone} onChange={handleInputChange} className="border border-gray-300 p-3 rounded-md w-full focus:ring-1 focus:ring-gray-900 outline-none bg-white" />
                                                <input type="text" name="specificAddress" placeholder="Số nhà, Tên đường..." value={formData.specificAddress} onChange={handleInputChange} className="border border-gray-300 p-3 rounded-md w-full focus:ring-1 focus:ring-gray-900 outline-none bg-white md:col-span-2" />

                                                <select className="border border-gray-300 p-3 rounded-md w-full bg-white outline-none focus:ring-1 focus:ring-gray-900" value={selectedProvince} onChange={handleProvinceChange}>
                                                    <option value="">Chọn Tỉnh/Thành phố</option>
                                                    {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                                                </select>
                                                <select className="border border-gray-300 p-3 rounded-md w-full bg-white outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100" value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedProvince}>
                                                    <option value="">Chọn Quận/Huyện</option>
                                                    {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                                                </select>
                                                <select className="border border-gray-300 p-3 rounded-md w-full md:col-span-2 bg-white outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100" value={selectedWard} onChange={handleWardChange} disabled={!selectedDistrict}>
                                                    <option value="">Chọn Phường/Xã</option>
                                                    {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Vận chuyển & Thanh toán giữ nguyên UI như cũ nhưng dùng rounded-md */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-gray-900">Đơn vị vận chuyển</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center justify-between border-2 p-4 rounded-md cursor-pointer transition ${shippingMethod === 'GHN' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" checked readOnly className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <span className="font-bold text-gray-900">Giao Hàng Nhanh (GHN)</span>
                                        <p className="text-xs text-gray-500 mt-0.5">Vận chuyển tiêu chuẩn</p>
                                    </div>
                                </div>
                                <span className="font-black text-blue-600 text-lg">
                                    {loadingFee ? '...' : formatCurrency(shippingFee)}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-gray-900">Phương thức thanh toán</h3>
                        <div className="space-y-3 text-sm">
                            <label className={`flex items-center gap-3 border-2 p-4 rounded-md cursor-pointer transition ${paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                            </label>
                            <label className={`flex items-center gap-3 border-2 p-4 rounded-md cursor-pointer transition ${paymentMethod === 'VNPAY' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600" />
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">Thanh toán qua VNPay</span>
                                    <img src="/vnpay-logo.png" alt="VNPay" className="h-5 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: TỔNG KẾT --- */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 sticky top-28">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-5 border-b border-gray-100 pb-4 text-gray-900">Tổng quan đơn hàng</h3>

                        <div className="mb-5 p-4 rounded-md border border-gray-200 bg-gray-50">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">
                                <TicketPercent size={14} className="text-blue-600" />
                                Mã khuyến mãi
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                    placeholder="Nhập mã giảm giá"
                                    className="flex-1 border border-gray-300 p-3 rounded-md bg-white outline-none focus:ring-1 focus:ring-gray-900 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyCoupon}
                                    disabled={applyingCoupon || loadingFee || cartItems.length === 0}
                                    className="px-4 py-3 rounded-md bg-blue-600 text-white font-bold text-xs uppercase tracking-wide hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {applyingCoupon ? 'Đang áp dụng...' : 'Áp dụng ngay'}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">
                                Mã sẽ được kiểm tra khi bạn bấm đặt hàng.
                            </p>
                            {appliedCouponCode && couponDiscount > 0 && (
                                <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                                    Đã áp dụng {appliedCouponCode}: -{formatCurrency(couponDiscount)}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 text-gray-600 mb-6 text-sm">
                            <div className="flex justify-between items-center">
                                <span>Tạm tính ({cartItems.length} sản phẩm):</span>
                                <span className="font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Giảm giá:</span>
                                <span className="font-bold text-emerald-600">-{formatCurrency(couponDiscount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Phí vận chuyển:</span>
                                <span className="font-bold text-blue-600">
                                    {loadingFee ? '...' : (shippingFee > 0 ? formatCurrency(shippingFee) : '0 đ')}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mb-6 font-sans">
                            <div className="flex justify-between items-end">
                                <span className="font-black text-gray-900 uppercase">Tổng cộng:</span>
                                <div className="text-right">
                                    <div className="font-black text-2xl text-red-600 leading-none">
                                        {loadingFee ? '...' : formatCurrency(finalTotal)}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">(Đã bao gồm VAT)</div>
                                </div>
                            </div>
                        </div>

                        {/* NÚT ĐẶT HÀNG NGAY - Đã cập nhật Gradient Anim */}
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loadingFee || isFetchingAddress || stockMismatches.length > 0}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-md font-bold text-sm text-white bg-linear-to-r from-blue-600 via-blue-800 to-gray-900 bg-size-[300%_auto] bg-position-[0%_center] hover:bg-position-[100%_center] transition-all duration-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-widerdisabled:opacity-50"
                        >
                            {stockMismatches.length > 0
                                ? "Vui lòng cập nhật giỏ hàng"
                                : paymentMethod === 'VNPAY' ? 'THANH TOÁN VNPAY' : 'ĐẶT HÀNG NGAY'
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}