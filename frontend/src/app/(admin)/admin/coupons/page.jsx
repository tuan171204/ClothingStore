'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/services/couponService';
import { Plus, Edit, Trash2, Ticket, X, Search, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '', description: '', discountType: 'PERCENTAGE',
        discountValue: '', maxDiscountAmount: '', minOrderValue: '',
        applyType: 'ORDER', startDate: '', endDate: '', isActive: true
    });
    const [saving, setSaving] = useState(false);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const data = await getCoupons();
            // Đảm bảo setCoupons luôn nhận mảng, kể cả khi backend trả về null/undefined
            console.log("Dữ liệu Coupon nhận về:", data);
            setCoupons(data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách mã giảm giá!');
            setCoupons([]); // Fallback về mảng rỗng
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    // Helper: Định dạng ngày để hiển thị trong input datetime-local (YYYY-MM-DDTHH:mm)
    const formatDateTimeLocal = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    const filtered = useMemo(() => {
        const list = Array.isArray(coupons) ? coupons : [];
        if (!keyword.trim()) return list;
        const kw = keyword.trim().toLowerCase();
        return list.filter(c => c.code?.toLowerCase().includes(kw));
    }, [coupons, keyword]);

    const openModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ...coupon,
                startDate: formatDateTimeLocal(coupon.startDate),
                endDate: formatDateTimeLocal(coupon.endDate)
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '', description: '', discountType: 'PERCENTAGE',
                discountValue: '', maxDiscountAmount: '', minOrderValue: '',
                applyType: 'ORDER', startDate: '', endDate: '', isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingCoupon) {
                await updateCoupon(editingCoupon.id, formData);
                toast.success('Cập nhật mã giảm giá thành công!');
            } else {
                await createCoupon(formData);
                toast.success('Thêm mã giảm giá thành công!');
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mã này?')) return;
        try {
            await deleteCoupon(id);
            toast.success('Xóa mã thành công!');
            fetchCoupons();
        } catch {
            toast.error('Lỗi khi xóa mã giảm giá!');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Ticket size={24} className="text-purple-600" />
                        Quản lý Mã giảm giá
                    </h1>
                    <p className="text-md text-gray-500 mt-0.5">
                        {coupons?.length || 0} mã hiện có · {filtered?.length || 0} hiển thị
                    </p>
                </div>
                <button onClick={() => openModal()}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer text-md">
                    <Plus size={17} /> Tạo mã mới
                </button>
            </div>

            {/* ── TOOLBAR ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Tìm theo mã code (VD: SUMMER20)..."
                        value={keyword} onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <button onClick={fetchCoupons}
                    className="flex items-center gap-2 px-4 py-2.5 text-md border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white text-gray-600 cursor-pointer font-medium">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Làm mới
                </button>
            </div>

            {/* ── TABLE ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center"><RefreshCw size={28} className="animate-spin text-purple-400" /></div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <Ticket size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Chưa có mã giảm giá nào được tìm thấy.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-md">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left">Code / Loại</th>
                                    <th className="px-5 py-3 text-left">Giá trị giảm</th>
                                    <th className="px-5 py-3 text-left">Áp dụng</th>
                                    <th className="px-5 py-3 text-left">Thời hạn</th>
                                    <th className="px-5 py-3 text-center">Trạng thái</th>
                                    <th className="px-5 py-3 text-center w-28">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-purple-700">{coupon.code}</div>
                                            <div className="text-xs text-gray-400">{coupon.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định'}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-semibold text-gray-800">
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `${coupon.discountValue?.toLocaleString()}đ`}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{coupon.applyType}</td>
                                        <td className="px-5 py-4 text-xs text-gray-500">
                                            <div>BĐ: {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('vi-VN') : '-'}</div>
                                            <div>KT: {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('vi-VN') : '-'}</div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {coupon.isActive ? <CheckCircle size={18} className="text-green-500 mx-auto" /> : <XCircle size={18} className="text-red-400 mx-auto" />}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(coupon)} className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer transition-colors"><Edit size={15} /></button>
                                                <button onClick={() => handleDelete(coupon.id)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-colors"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">{editingCoupon ? 'Cập nhật mã' : 'Tạo mã giảm giá mới'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer transition-colors text-gray-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã code</label>
                                <input type="text" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-400 outline-none transition-all" 
                                    value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: SUMMER2026" />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả</label>
                                <textarea className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-400 outline-none" 
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Chi tiết ưu đãi..." rows={2} />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại giảm giá</label>
                                <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5" value={formData.discountType}
                                    onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                                    <option value="PERCENTAGE">Phần trăm (%)</option>
                                    <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá trị giảm</label>
                                <input type="number" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                                    value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá trị đơn tối thiểu</label>
                                <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                                    value={formData.minOrderValue} onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })} placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Số tiền giảm tối đa</label>
                                <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                                    value={formData.maxDiscountAmount} onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })} placeholder="Để trống nếu không giới hạn" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày bắt đầu</label>
                                <input type="datetime-local" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                                    value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày kết thúc</label>
                                <input type="datetime-local" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                                    value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                            
                            <div className="md:col-span-2 flex items-center gap-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
                                <input type="checkbox" id="isActive" className="w-5 h-5 accent-purple-600" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                                <label htmlFor="isActive" className="text-sm font-bold text-purple-900 cursor-pointer uppercase tracking-tight">Kích hoạt mã giảm giá ngay bây giờ</label>
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors">Hủy</button>
                                <button type="submit" disabled={saving} className="px-8 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-bold shadow-lg shadow-purple-200 disabled:opacity-50 transition-all active:scale-95">
                                    {saving ? <RefreshCw className="animate-spin inline mr-2" size={18} /> : null}
                                    {saving ? 'Đang lưu...' : (editingCoupon ? 'Cập nhật ngay' : 'Tạo mã mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}