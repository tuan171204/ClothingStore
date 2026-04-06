'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/services/productService';
import { calculateShippingFee, getProvinces, getDistricts, getWards } from '@/services/shippingService';
import { createPaymentUrl } from '@/services/paymentService';
import { addressService } from '@/services/addressService';
import { checkoutService } from '@/services/checkoutService';
import { applyCoupon } from '@/services/couponService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { MapPin, CheckCircle2, Plus, AlertTriangle, Ticket, Loader2, X, AlertCircle } from 'lucide-react';
import CouponSelectDrawer from '@/components/shop/CouponSelectDrawer';

// ─── WIDGET MÃ GIẢM GIÁ ĐƯỢC TÁCH RIÊNG ─────────────────────────────────────
function CouponWidget({ cartItems, subtotal, onApply, appliedCoupon }) {
    const [code, setCode] = useState('');
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');

    const handleApply = async () => {
        if (!code.trim()) { setError('Vui lòng nhập mã giảm giá'); return; }
        setApplying(true);
        setError('');
        try {
            const res = await applyCoupon(code.trim().toUpperCase(), subtotal, cartItems.map(item => ({
                skuId: item.skuId,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            })));
            if (res?.valid) {
                toast.success(`Áp dụng mã thành công! Giảm ${formatCurrency(res.discountAmount)}`);
                onApply(res);
                setCode('');
            } else {
                setError(res?.message || 'Mã không hợp lệ');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Không thể kiểm tra mã. Thử lại sau.');
        } finally {
            setApplying(false);
        }
    };

    if (appliedCoupon) {
        return (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-4 py-3 mb-5">
                <div className="flex items-center gap-2 text-green-700">
                    <Ticket size={16} />
                    <span className="font-bold font-mono">{appliedCoupon.code}</span>
                    <span className="text-md">– Giảm {formatCurrency(appliedCoupon.discountAmount)}</span>
                </div>
                <button onClick={() => onApply(null)} className="text-green-500 hover:text-red-500 transition-colors cursor-pointer">
                    <X size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2 mb-5">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Ticket size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Nhập mã giảm giá..."
                        value={code}
                        onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleApply()}
                        className={`w-full pl-9 pr-4 py-2.5 border rounded-md text-md focus:outline-none focus:ring-1 focus:ring-blue-600 font-sans tracking-widest
                            ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                </div>
                <button
                    onClick={handleApply}
                    disabled={applying || !code.trim()}
                    className="px-4 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white rounded-md font-bold text-md transition-colors flex items-center gap-2 cursor-pointer min-w-[90px] justify-center">
                    {applying ? <Loader2 size={16} className="animate-spin" /> : 'Áp dụng'}
                </button>
            </div>
            {error && (
                <p className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                    <AlertCircle size={13} /> {error}
                </p>
            )}
        </div>
    );
}
// ────────────────────────────────────────────────────────────────────────────

export const CouponTriggerAndDrawer = ({
    cartItems,
    cartTotal,
    appliedCoupon,
    setAppliedCoupon,
    isCouponDrawerOpen,
    setIsCouponDrawerOpen,
    formatCurrency,
}) => (
    <>
        {/* ── Coupon trigger button ───────────────────────────────────── */}
        {appliedCoupon ? (
            /* Applied coupon badge — click to open drawer to change/remove */
            <button
                onClick={() => setIsCouponDrawerOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 mb-5 
                           bg-green-50 border border-green-300 rounded-xl text-md cursor-pointer
                           hover:border-green-400 transition-colors"
            >
                <div className="flex items-center gap-2 text-green-800">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" className="text-green-600 shrink-0">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                        <path d="M13 5v2M13 17v2M13 11v2" />
                    </svg>
                    <span className="font-mono font-bold tracking-wider">{appliedCoupon.code}</span>
                    <span className="text-green-600">· Giảm {formatCurrency(appliedCoupon.discountAmount)}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Đổi mã</span>
            </button>
        ) : (
            /* No coupon yet — open drawer */
            <button
                onClick={() => setIsCouponDrawerOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 mb-5 
                           border border-dashed border-gray-300 rounded-xl text-md cursor-pointer
                           hover:border-gray-500 hover:bg-gray-50 transition-all group"
            >
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-gray-900">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" className="shrink-0">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                        <path d="M13 5v2M13 17v2M13 11v2" />
                    </svg>
                    <span>Chọn hoặc nhập mã giảm giá</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" className="text-gray-400">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </button>
        )}

        {/* ── Drawer (portals to body) ────────────────────────────────── */}
        <CouponSelectDrawer
            isOpen={isCouponDrawerOpen}
            onClose={() => setIsCouponDrawerOpen(false)}
            orderTotal={cartTotal}
            cartItems={cartItems}
            appliedCoupon={appliedCoupon}
            onApply={setAppliedCoupon}
        />
    </>
);
// ────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
    const { cartItems, cartTotal, clearCart, validateCart } = useCart();
    const router = useRouter();

    // --- State SỔ ĐỊA CHỈ ---
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [isFetchingAddress, setIsFetchingAddress] = useState(true);

    // --- Thông tin người mua ---
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
    const [shippingFee, setShippingFee] = useState(0);
    const [loadingFee, setLoadingFee] = useState(false);

    // State lưu mã khuyến mãi
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const [stockMismatches, setStockMismatches] = useState([]);
    const [checkoutError, setCheckoutError] = useState(null);

    // Tính toán tiền giảm giá
    const discountAmount = appliedCoupon?.discountAmount || 0;
    const finalTotal = Math.max(0, cartTotal + shippingFee - discountAmount);

    const [isCouponDrawerOpen, setIsCouponDrawerOpen] = useState(false);

    // 1. Khởi tạo dữ liệu
    useEffect(() => {
        const initData = async () => {
            setIsFetchingAddress(true);
            try {
                const provData = await getProvinces();
                setProvinces(provData);

                const addressRes = await addressService.getAllMyAddresses();
                if (addressRes.result && addressRes.result.length > 0) {
                    setSavedAddresses(addressRes.result);
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
                couponCode: appliedCoupon?.code || null, // THÊM COUPON VÀO ĐÂY
                items: cartItems.map(item => ({ skuId: item.skuId, name: item.productName, quantity: item.quantity, price: item.price }))
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
                couponCode: appliedCoupon?.code || null, // THÊM COUPON VÀO ĐÂY
                items: cartItems.map(item => ({ skuId: item.skuId, name: item.productName, quantity: item.quantity, price: item.price }))
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
                setStockMismatches(responseData.stockMismatches || []);
                setCheckoutError(responseData.message);

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
        <div className="min-h-screen bg-gray-50 py-10 font-sans mt-20">
            {stockMismatches.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-red-500" />
                        <p className="font-bold text-red-800">Không thể đặt hàng</p>
                    </div>
                    <ul className="space-y-2">
                        {stockMismatches.map(m => (
                            <li key={m.skuId} className="text-md text-red-700 flex items-center gap-2">
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
                            <div className="py-8 text-center text-gray-500 text-md">Đang tải sổ địa chỉ...</div>
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
                                        <div className="flex-1 space-y-1 text-md">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-base text-gray-900">{addr.receiverName}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-gray-600 font-medium">{addr.phone}</span>
                                                {addr.default && (
                                                    <span className="ml-auto inline-flex items-center gap-1 text-[20px] font-bold text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded">
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

                                        {selectedAddressId === 'new' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 animate-fade-in text-md">
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

                    {/* Vận chuyển */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-gray-900">Đơn vị vận chuyển</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center justify-between border-2 p-4 rounded-md cursor-pointer transition ${shippingMethod === 'GHN' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" checked readOnly className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <span className="font-bold text-gray-900">Giao Hàng Nhanh (GHN)</span>
                                        <p className="text-sm text-gray-500 mt-0.5">Vận chuyển tiêu chuẩn</p>
                                    </div>
                                </div>
                                <span className="font-black text-blue-600 text-xl">
                                    {loadingFee ? '...' : formatCurrency(shippingFee)}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Thanh toán */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-gray-900">Phương thức thanh toán</h3>
                        <div className="space-y-3 text-md">
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
                        <h3 className="text-xl font-black uppercase tracking-tight mb-5 border-b border-gray-100 pb-4 text-gray-900">Tổng quan đơn hàng</h3>

                        <CouponTriggerAndDrawer
                            cartItems={cartItems}
                            cartTotal={cartTotal}
                            appliedCoupon={appliedCoupon}
                            setAppliedCoupon={setAppliedCoupon}
                            isCouponDrawerOpen={isCouponDrawerOpen}
                            setIsCouponDrawerOpen={setIsCouponDrawerOpen}
                            formatCurrency={formatCurrency}
                        />

                        <div className="space-y-3 text-gray-600 mb-6 text-md">
                            <div className="flex justify-between items-center">
                                <span>Tạm tính ({cartItems.length} sản phẩm):</span>
                                <span className="font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Phí vận chuyển:</span>
                                <span className="font-bold text-gray-900">
                                    {loadingFee ? '...' : (shippingFee > 0 ? formatCurrency(shippingFee) : '0 đ')}
                                </span>
                            </div>

                            {/* HIỂN THỊ TIỀN GIẢM GIÁ NẾU CÓ */}
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center text-green-600 font-semibold">
                                    <span className="flex items-center gap-1"><Ticket size={14} /> Giảm giá ({appliedCoupon?.code}):</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 pt-4 mb-6 font-sans">
                            <div className="flex justify-between items-end">
                                <span className="font-black text-gray-900 uppercase">Tổng cộng:</span>
                                <div className="text-right">
                                    <div className="font-black text-2xl text-red-600 leading-none">
                                        {loadingFee ? '...' : formatCurrency(finalTotal)}
                                    </div>
                                    <div className="text-[20px] text-gray-400 mt-1 uppercase tracking-wider">(Đã bao gồm VAT)</div>
                                </div>
                            </div>
                        </div>

                        {/* NÚT ĐẶT HÀNG NGAY */}
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loadingFee || isFetchingAddress || stockMismatches.length > 0}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-md font-bold text-md text-white bg-linear-to-r from-blue-600 via-blue-800 to-gray-900 bg-size-[300%_auto] bg-position-[0%_center] hover:bg-position-[100%_center] transition-all duration-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
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