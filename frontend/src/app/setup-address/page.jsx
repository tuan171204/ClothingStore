'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import { getProvinces, getDistricts, getWards } from '@/services/shippingService';
import { addressService } from '@/services/addressService';
import { toast } from 'react-toastify';

function SetupAddressContent() {
    const router = useRouter();

    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';

    const [isLoading, setIsLoading] = useState(false);

    // Dữ liệu GHN
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({
        receiverName: '',
        phone: '',
        streetAddress: '',
        provinceId: '',
        districtId: '',
        wardCode: ''
    });

    useEffect(() => {
        getProvinces().then(data => setProvinces(data));
    }, []);

    // Xử lý thay đổi Tỉnh
    const handleProvinceChange = async (e) => {
        const provinceId = e.target.value;
        setFormData(prev => ({ ...prev, provinceId, districtId: '', wardCode: '' }));
        setDistricts([]);
        setWards([]);
        if (provinceId) {
            const data = await getDistricts(Number(provinceId));
            setDistricts(data);
        }
    };

    // Xử lý thay đổi Huyện
    const handleDistrictChange = async (e) => {
        const districtId = e.target.value;
        setFormData(prev => ({ ...prev, districtId, wardCode: '' }));
        setWards([]);
        if (districtId) {
            const data = await getWards(Number(districtId));
            setWards(data);
        }
    };

    // Hàm Helper lấy tên từ ID
    const findName = (list, idKey, idVal, nameKey) => {
        const found = list.find(item => String(item[idKey]) === String(idVal));
        return found ? found[nameKey] : '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const provinceName = findName(provinces, 'ProvinceID', formData.provinceId, 'ProvinceName');
            const districtName = findName(districts, 'DistrictID', formData.districtId, 'DistrictName');
            const wardName = findName(wards, 'WardCode', formData.wardCode, 'WardName');

            const payload = {
                receiverName: formData.receiverName,
                phone: formData.phone,
                streetAddress: formData.streetAddress,
                provinceId: Number(formData.provinceId),
                provinceName: provinceName,
                districtId: Number(formData.districtId),
                districtName: districtName,
                wardCode: String(formData.wardCode),
                wardName: wardName,
                isDefault: true
            };

            await addressService.addNewAddress(payload);
            toast.success('Thêm địa chỉ mới thành công!');
            router.push(redirectUrl);
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu địa chỉ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        toast.info('Bạn có thể cập nhật địa chỉ sau trong phần Hồ sơ');
        router.push(redirectUrl);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-200 overflow-hidden mt-10">

                {/* --- HEADER TỐI GIẢN --- */}
                <div className="px-8 pt-10 pb-6 text-center border-b border-gray-100">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Sổ địa chỉ</h2>
                    <p className="mt-2 text-gray-500 text-sm">Vui lòng cung cấp địa chỉ giao hàng để chúng tôi phục vụ bạn tốt nhất.</p>
                </div>

                {/* --- FORM SECTION --- */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Họ và tên <span className="text-red-500">*</span></label>
                            <input
                                required type="text"
                                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all bg-white text-sm"
                                placeholder="Nhập họ và tên"
                                value={formData.receiverName}
                                onChange={e => setFormData({ ...formData, receiverName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                            <input
                                required type="tel"
                                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all bg-white text-sm"
                                placeholder="Nhập số điện thoại"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tỉnh / Thành <span className="text-red-500">*</span></label>
                            <select
                                required
                                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all bg-white text-sm cursor-pointer"
                                value={formData.provinceId}
                                onChange={handleProvinceChange}
                            >
                                <option value="">Chọn Tỉnh/Thành</option>
                                {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quận / Huyện <span className="text-red-500">*</span></label>
                            <select
                                required disabled={!formData.provinceId}
                                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all bg-white text-sm disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
                                value={formData.districtId}
                                onChange={handleDistrictChange}
                            >
                                <option value="">Chọn Quận/Huyện</option>
                                {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phường / Xã <span className="text-red-500">*</span></label>
                            <select
                                required disabled={!formData.districtId}
                                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all bg-white text-sm disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
                                value={formData.wardCode}
                                onChange={e => setFormData({ ...formData, wardCode: e.target.value })}
                            >
                                <option value="">Chọn Phường/Xã</option>
                                {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                        <input
                            required type="text"
                            className="w-full border border-gray-300 px-4 py-3 rounded-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all bg-white text-sm"
                            placeholder="Số nhà, Tên đường, Tòa nhà..."
                            value={formData.streetAddress}
                            onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                        />
                    </div>

                    {/* --- ACTIONS SECTION --- */}
                    <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-end">
                        <button
                            type="button" onClick={handleSkip}
                            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            BỎ QUA
                        </button>

                        {/* Nút lưu với Gradient Anim giống trang Cart/Checkout */}
                        <button
                            type="submit" disabled={isLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 rounded-md font-bold text-sm text-white bg-linear-to-r from-blue-600 via-blue-800 to-gray-900 bg-[length:300%_auto] bg-[0%_center] hover:bg-[100%_center] transition-all duration-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
                        >
                            {isLoading ? 'ĐANG LƯU...' : 'LƯU ĐỊA CHỈ'} {!isLoading && <ArrowRight size={16} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SetupAddressPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center font-sans">
                Đang tải thông tin...
            </div>
        }>
            <SetupAddressContent />
        </Suspense>
    );
}