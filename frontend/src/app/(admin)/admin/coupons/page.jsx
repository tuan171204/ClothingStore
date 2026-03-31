'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/services/couponService';
import { Plus, Edit, Trash2, Ticket, X, Search, RefreshCw, CheckCircle, XCircle, Eye, Info,Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false); // Modal chi tiết
    const [selectedCoupon, setSelectedCoupon] = useState(null); // Coupon đang xem chi tiết
    const [editingCoupon, setEditingCoupon] = useState(null);
const [formData, setFormData] = useState({
    code: '', 
    description: '', 
    discountType: 'PERCENTAGE',
    discountValue: '', 
    maxDiscountAmount: '', 
    minOrderValue: '',
    applyType: 'ORDER', // Đã có
    usageLimit: '',     // MỚI: Thêm trường này
    startDate: '', 
    endDate: '', 
    isActive: true
});
    const [saving, setSaving] = useState(false);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const data = await getCoupons();
            setCoupons(data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách mã giảm giá!');
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

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

    // Mở modal xem chi tiết
    const openDetail = (coupon) => {
        setSelectedCoupon(coupon);
        setIsDetailOpen(true);
    };

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
                toast.success('Cập nhật mã thành công!');
            } else {
                await createCoupon(formData);
                toast.success('Thêm mã thành công!');
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
            {/* HEADER */}
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
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-md active:scale-95 cursor-pointer">
                    <Plus size={17} /> Tạo mã mới
                </button>
            </div>

            {/* TOOLBAR */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Tìm theo mã code..."
                        value={keyword} onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <button onClick={fetchCoupons}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white text-gray-600 font-medium">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Làm mới
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center"><RefreshCw size={28} className="animate-spin text-purple-400" /></div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <Ticket size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Chưa có mã giảm giá nào.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <th className="px-6 py-4 text-left">Code / Loại</th>
                                    <th className="px-6 py-4 text-left">Giá trị</th>
                                    <th className="px-6 py-4 text-left">Áp dụng</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-purple-700">{coupon.code}</div>
                                            <div className="text-[10px] uppercase font-bold text-gray-400">{coupon.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}</div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">
                                            {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `${coupon.discountValue?.toLocaleString()}đ`}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{coupon.applyType}</td>
                                        <td className="px-6 py-4">
                                            {coupon.isActive ? <div className="flex items-center justify-center text-green-500 gap-1 text-xs font-bold"><CheckCircle size={14}/> Hoạt động</div> : <div className="flex items-center justify-center text-red-400 gap-1 text-xs font-bold"><XCircle size={14}/> Tạm khóa</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button title="Xem chi tiết" onClick={() => openDetail(coupon)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Eye size={16} /></button>
                                                <button title="Sửa" onClick={() => openModal(coupon)} className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"><Edit size={16} /></button>
                                                <button title="Xóa" onClick={() => handleDelete(coupon.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── MODAL CHI TIẾT (FULL VIEW) ── */}
{isDetailOpen && selectedCoupon && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Header: Banner Mã Giảm Giá */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-8 py-10 text-white relative">
                <button onClick={() => setIsDetailOpen(false)} 
                    className="absolute top-5 right-5 p-2 hover:bg-white/20 rounded-full transition-all text-white">
                    <X size={24} />
                </button>
                <div className="flex flex-col items-center text-center">
                    <div className="bg-white/20 p-3 rounded-2xl mb-4 backdrop-blur-sm">
                        <Ticket size={40} className="text-white" />
                    </div>
                    <h2 className="text-4xl font-black tracking-widest uppercase mb-2">{selectedCoupon.code}</h2>
                    <div className="px-4 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                        {selectedCoupon.discountType === 'PERCENTAGE' ? 'Chiết khấu theo phần trăm' : 'Giảm tiền mặt trực tiếp'}
                    </div>
                    <p className="mt-4 text-purple-100 italic text-sm max-w-md">
                        "{selectedCoupon.description || 'Không có mô tả chi tiết cho chương trình khuyến mãi này.'}"
                    </p>
                </div>
            </div>

            {/* Body: Thông tin chi tiết chia theo cụm */}
            <div className="p-8 overflow-y-auto space-y-8">
                
                {/* Luồng 1: Hiệu suất sử dụng (Usage Analytics) */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <RefreshCw size={14} /> Hiệu suất sử dụng
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Đã dùng</p>
                            <p className="text-2xl font-black text-purple-600">{selectedCoupon.usedCount || 0}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Lượt thanh toán</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Giới hạn tối đa</p>
                            <p className="text-2xl font-black text-gray-800">{selectedCoupon.usageLimit || '∞'}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Tổng lượt phát hành</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Còn lại</p>
                            <p className="text-2xl font-black text-green-600">
                                {selectedCoupon.usageLimit ? (selectedCoupon.usageLimit - (selectedCoupon.usedCount || 0)) : '∞'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">Lượt có thể dùng</p>
                        </div>
                    </div>
                </div>

                {/* Luồng 2: Giá trị & Điều kiện (Values & Constraints) */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={14} /> Giá trị & Điều kiện đơn hàng
                    </h3>
                    <div className="grid grid-cols-2 gap-x-10 gap-y-4 px-2">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-gray-500 text-sm">Mức giảm:</span>
                            <span className="font-bold text-gray-800">
                                {selectedCoupon.discountType === 'PERCENTAGE' ? `${selectedCoupon.discountValue}%` : `${selectedCoupon.discountValue?.toLocaleString()}đ`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-gray-500 text-sm">Đơn tối thiểu:</span>
                            <span className="font-bold text-gray-800">{selectedCoupon.minOrderValue?.toLocaleString() || 0}đ</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-gray-500 text-sm">Giảm tối đa:</span>
                            <span className="font-bold text-pink-600">
                                {selectedCoupon.maxDiscountAmount ? `${selectedCoupon.maxDiscountAmount?.toLocaleString()}đ` : 'Không giới hạn'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-gray-500 text-sm">Đối tượng:</span>
                            <span className="font-bold text-blue-600">{selectedCoupon.applyType === 'ORDER' ? 'Toàn bộ đơn' : 'Sản phẩm chọn lọc'}</span>
                        </div>
                    </div>
                </div>

                {/* Luồng 3: Thời gian & Trạng thái (Timeline) */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar size={14} /> Thời gian hiệu lực
                    </h3>
                    <div className="bg-purple-50 rounded-2xl p-5 flex items-center justify-around border border-purple-100">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-purple-400 uppercase">Ngày bắt đầu</p>
                            <p className="text-md font-bold text-purple-900">{new Date(selectedCoupon.startDate).toLocaleString('vi-VN')}</p>
                        </div>
                        <div className="w-10 h-[2px] bg-purple-200"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-purple-400 uppercase">Ngày hết hạn</p>
                            <p className="text-md font-bold text-purple-900">{new Date(selectedCoupon.endDate).toLocaleString('vi-VN')}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="text-sm text-gray-500">Trạng thái hiện tại:</span>
                        {selectedCoupon.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full"><CheckCircle size={14}/> Đang hoạt động</span>
                        ) : (
                            <span className="flex items-center gap-1 text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded-full"><XCircle size={14}/> Đang tạm khóa</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer: Nút đóng */}
            <div className="p-6 bg-gray-50 border-t flex justify-end">
                <button onClick={() => setIsDetailOpen(false)} 
                    className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-black text-gray-600 hover:bg-gray-100 transition-all active:scale-95 shadow-sm">
                    ĐÓNG CỬA SỔ
                </button>
            </div>
        </div>
    </div>
)}

            {/* ── MODAL TẠO / CẬP NHẬT ── */}
{isModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {editingCoupon ? <Edit size={20} className="text-amber-500" /> : <Plus size={20} className="text-purple-600" />}
                    {editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer transition-colors text-gray-500">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* SECTION 1: THÔNG TIN MÃ */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã Code (Viết liền, không dấu)</label>
                        <input type="text" required 
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-400 outline-none transition-all font-mono text-purple-700 font-bold" 
                            value={formData.code} 
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })} 
                            placeholder="VD: KHUYENMAI2026" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Mô tả chương trình</label>
                        <textarea className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-400 outline-none" 
                            value={formData.description} 
                            onChange={e => setFormData({ ...formData, description: e.target.value })} 
                            placeholder="VD: Giảm giá đặc biệt cho khách hàng mới..." rows={2} />
                    </div>

                    {/* SECTION 2: LOGIC GIẢM GIÁ */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại giảm giá</label>
                        <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white" 
                            value={formData.discountType}
                            onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                            <option value="PERCENTAGE">Phần trăm (%)</option>
                            <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá trị giảm</label>
                        <div className="relative">
                            <input type="number" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                                value={formData.discountValue} 
                                onChange={e => setFormData({ ...formData, discountValue: e.target.value })} />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                {formData.discountType === 'PERCENTAGE' ? '%' : 'đ'}
                            </span>
                        </div>
                    </div>

                    {/* SECTION 3: ĐIỀU KIỆN ÁP DỤNG */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Áp dụng cho</label>
                        <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white" 
                            value={formData.applyType}
                            onChange={e => setFormData({ ...formData, applyType: e.target.value })}>
                            <option value="ORDER">Toàn bộ đơn hàng</option>
                            <option value="SPECIFIC_PRODUCTS">Sản phẩm cụ thể</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Tổng lượt sử dụng</label>
                        <input type="number" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                            value={formData.usageLimit} 
                            onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} 
                            placeholder="VD: 100" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Đơn tối thiểu (đ)</label>
                        <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                            value={formData.minOrderValue} 
                            onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })} 
                            placeholder="0" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Giảm tối đa (đ)</label>
                        <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                            disabled={formData.discountType === 'FIXED_AMOUNT'}
                            value={formData.maxDiscountAmount} 
                            onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })} 
                            placeholder={formData.discountType === 'FIXED_AMOUNT' ? 'Không cần thiết' : 'VD: 50000'} />
                    </div>

                    {/* SECTION 4: THỜI GIAN */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                            <Calendar size={14} /> Ngày bắt đầu
                        </label>
                        <input type="datetime-local" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                            value={formData.startDate} 
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                            <Calendar size={14} /> Ngày kết thúc
                        </label>
                        <input type="datetime-local" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                            value={formData.endDate} 
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                    </div>
                    
                    {/* TRẠNG THÁI */}
                    <div className="md:col-span-2 flex items-center gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100 mt-2">
                        <input type="checkbox" id="isActive" 
                            className="w-5 h-5 accent-purple-600 cursor-pointer" 
                            checked={formData.isActive} 
                            onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                        <label htmlFor="isActive" className="text-sm font-bold text-purple-900 cursor-pointer select-none">
                            KÍCH HOẠT MÃ GIẢM GIÁ NÀY NGAY LẬP TỨC
                        </label>
                    </div>

                    {/* ACTIONS */}
                    <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t mt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} 
                            className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={saving} 
                            className="px-8 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-bold shadow-lg shadow-purple-100 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95">
                            {saving && <RefreshCw className="animate-spin" size={18} />}
                            {editingCoupon ? 'Lưu thay đổi' : 'Tạo mã ngay'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
)}
        </div>
    );
}