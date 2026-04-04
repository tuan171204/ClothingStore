'use client';

// ── Drop-in patch for frontend/src/app/(admin)/admin/coupons/page.jsx ──
// Changes from the original:
//   1. Import CouponProductMappingModal
//   2. Add mappingCoupon state
//   3. Render a "Gán SP" button on PRODUCT-type coupons
//   4. Render the modal when mappingCoupon is set

import React, { useEffect, useState, useCallback } from 'react';
import { getCouponsPaged, createCoupon, updateCoupon, deleteCoupon } from '@/services/couponService';
import {
    Plus, Edit, Trash2, Ticket, X, RefreshCw, CheckCircle, XCircle,
    Eye, Calendar, Filter, Tag
} from 'lucide-react';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Pagination from '@/components/admin/Pagination';
import CouponProductMappingModal from '@/components/admin/CouponProductMappingModal';

const PAGE_SIZE = 10;
const formatVnd = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '—';

export default function CouponsPage() {
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const [applyTypeFilter, setApplyTypeFilter] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

    const [detailCoupon, setDetailCoupon] = useState(null);
    const [mappingCoupon, setMappingCoupon] = useState(null); // NEW

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState(defaultForm());
    const [saving, setSaving] = useState(false);

    function defaultForm() {
        return {
            code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
            maxDiscountAmount: '', minOrderValue: '', applyType: 'ORDER',
            usageLimit: '', startDate: null, endDate: null, isActive: true
        };
    }

    const fetchCoupons = useCallback(async (pg = page) => {
        setLoading(true);
        try {
            const res = await getCouponsPaged({
                applyType: applyTypeFilter || undefined,
                isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
                startDate: startDateFilter || undefined,
                endDate: endDateFilter || undefined,
                page: pg, size: PAGE_SIZE,
            });
            const paged = res?.result || res;
            if (paged && 'content' in paged) setData(paged);
            else if (Array.isArray(paged)) setData({ content: paged, totalElements: paged.length, totalPages: 1 });
            else setData({ content: [], totalElements: 0, totalPages: 0 });
        } catch { toast.error('Lỗi tải mã giảm giá!'); }
        finally { setLoading(false); }
    }, [applyTypeFilter, isActiveFilter, startDateFilter, endDateFilter, page]);

    useEffect(() => { fetchCoupons(page); }, [page]);

    const applyFilters = () => { setPage(0); fetchCoupons(0); };
    const resetFilters = () => {
        setApplyTypeFilter(''); setIsActiveFilter('');
        setStartDateFilter(''); setEndDateFilter('');
        setPage(0); setTimeout(() => fetchCoupons(0), 0);
    };

    const hasActiveFilters = applyTypeFilter || isActiveFilter !== '' || startDateFilter || endDateFilter;

    const openModal = (coupon = null) => {
        setEditingCoupon(coupon);
        if (coupon) {
            setFormData({
                ...coupon,
                isActive: coupon.active,
                startDate: coupon.startDate ? new Date(coupon.startDate) : null,
                endDate: coupon.endDate ? new Date(coupon.endDate) : null,
            });
        } else { setFormData(defaultForm()); }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                discountValue: formData.discountValue ? Number(formData.discountValue) : 0,
                maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
                minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
                startDate: formData.startDate ? format(new Date(formData.startDate), "yyyy-MM-dd'T'HH:mm:ss") : null,
                endDate: formData.endDate ? format(new Date(formData.endDate), "yyyy-MM-dd'T'HH:mm:ss") : null,
            };
            if (editingCoupon) {
                await updateCoupon(editingCoupon.id, payload);
                toast.success('Cập nhật mã thành công!');
            } else {
                await createCoupon(payload);
                toast.success('Tạo mã giảm giá thành công!');
            }
            setIsModalOpen(false);
            fetchCoupons(page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa mã giảm giá này?')) return;
        try {
            await deleteCoupon(id);
            toast.success('Đã xóa mã!');
            const newPage = data.content.length === 1 && page > 0 ? page - 1 : page;
            setPage(newPage);
            fetchCoupons(newPage);
        } catch { toast.error('Lỗi khi xóa!'); }
    };

    const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-purple-400';

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Ticket size={22} className="text-purple-600" /> Quản lý Mã giảm giá
                    </h1>
                    <p className="text-md text-gray-500 mt-0.5">
                        {data.totalElements} mã · Trang {page + 1}/{data.totalPages || 1}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowFilters(p => !p)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-md font-medium transition-colors cursor-pointer
                            ${showFilters || hasActiveFilters ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        <Filter size={15} /> Bộ lọc
                        {hasActiveFilters && <span className="bg-purple-600 text-white text-sm px-1.5 py-0.5 rounded-full">!</span>}
                    </button>
                    <button onClick={() => openModal()}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer text-md">
                        <Plus size={17} /> Tạo mã mới
                    </button>
                </div>
            </div>

            {/* FILTER PANEL */}
            {showFilters && (
                <div className="bg-white border border-purple-100 rounded-xl p-5 mb-5 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Đối tượng áp dụng</label>
                            <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                                value={applyTypeFilter} onChange={e => setApplyTypeFilter(e.target.value)}>
                                <option value="">Tất cả</option>
                                <option value="ORDER">Toàn bộ đơn</option>
                                <option value="PRODUCT">Sản phẩm cụ thể</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Trạng thái</label>
                            <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                                value={isActiveFilter} onChange={e => setIsActiveFilter(e.target.value)}>
                                <option value="">Tất cả</option>
                                <option value="true">Đang hoạt động</option>
                                <option value="false">Đã tắt</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Hiệu lực từ</label>
                            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md outline-none focus:ring-2 focus:ring-purple-400"
                                value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Hiệu lực đến</label>
                            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-md outline-none focus:ring-2 focus:ring-purple-400"
                                value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                        <button onClick={applyFilters} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-md font-semibold hover:bg-purple-700 cursor-pointer">Áp dụng</button>
                        <button onClick={resetFilters} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-md hover:bg-gray-50 cursor-pointer">Xóa bộ lọc</button>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center"><RefreshCw size={28} className="animate-spin text-purple-400" /></div>
                ) : data.content.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <Ticket size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-md">Chưa có mã giảm giá nào.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-md">
                                <thead className="bg-gray-50 border-b text-sm font-bold text-gray-500 uppercase tracking-wide">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Code / Loại</th>
                                        <th className="px-5 py-3 text-left">Giá trị giảm</th>
                                        <th className="px-5 py-3 text-left">Đối tượng</th>
                                        <th className="px-5 py-3 text-left">Thời hạn</th>
                                        <th className="px-5 py-3 text-center">Sử dụng</th>
                                        <th className="px-5 py-3 text-center">Trạng thái</th>
                                        <th className="px-5 py-3 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.content.map(coupon => (
                                        <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-purple-700 font-mono">{coupon.code}</div>
                                                <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">
                                                    {coupon.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-gray-800">
                                                {coupon.discountType === 'PERCENTAGE'
                                                    ? `${coupon.discountValue}%`
                                                    : formatVnd(coupon.discountValue)}
                                                {coupon.maxDiscountAmount && (
                                                    <div className="text-sm text-pink-500 mt-0.5">Tối đa: {formatVnd(coupon.maxDiscountAmount)}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded text-sm font-semibold
                                                    ${coupon.applyType === 'ORDER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {coupon.applyType === 'ORDER' ? 'Toàn đơn' : 'Sản phẩm'}
                                                </span>
                                                {/* Show product count badge for PRODUCT-type coupons */}
                                                {coupon.applyType === 'PRODUCT' && coupon.appliedProductIds?.length > 0 && (
                                                    <div className="text-sm text-orange-600 mt-1 font-medium">
                                                        {coupon.appliedProductIds.length} SP được gán
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500">
                                                {coupon.startDate && <div>Từ: {new Date(coupon.startDate).toLocaleDateString('vi-VN')}</div>}
                                                {coupon.endDate && <div>Đến: {new Date(coupon.endDate).toLocaleDateString('vi-VN')}</div>}
                                                {!coupon.startDate && !coupon.endDate && <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-4 text-center text-sm">
                                                <span className="font-semibold text-gray-700">{coupon.usedCount || 0}</span>
                                                {coupon.usageLimit && <span className="text-gray-400">/{coupon.usageLimit}</span>}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {coupon.active
                                                    ? <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm"><CheckCircle size={12} /> Hoạt động</span>
                                                    : <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-sm"><XCircle size={12} /> Tắt</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* NEW: button to open product mapping modal */}
                                                    {coupon.applyType === 'PRODUCT' && (
                                                        <button
                                                            onClick={() => setMappingCoupon(coupon)}
                                                            className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer"
                                                            title="Gán sản phẩm"
                                                        >
                                                            <Tag size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => openModal(coupon)}
                                                        className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer" title="Sửa">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(coupon.id)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer" title="Xóa">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={page}
                            totalPages={data.totalPages}
                            totalElements={data.totalElements}
                            size={PAGE_SIZE}
                            onPageChange={setPage}
                            loading={loading}
                        />
                    </>
                )}
            </div>

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Mã Code *</label>
                                    <input type="text" required className={inputCls} value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                        placeholder="VD: SUMMER2026" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Mô tả</label>
                                    <textarea rows={2} className={inputCls + ' resize-none'} value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Loại giảm giá</label>
                                    <select className={inputCls + ' bg-white'} value={formData.discountType}
                                        onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                                        <option value="PERCENTAGE">Phần trăm (%)</option>
                                        <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Giá trị *</label>
                                    <input type="number" required className={inputCls} value={formData.discountValue}
                                        onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                        placeholder={formData.discountType === 'PERCENTAGE' ? 'VD: 20' : 'VD: 50000'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Giảm tối đa (đ)</label>
                                    <input type="number" className={inputCls} disabled={formData.discountType === 'FIXED_AMOUNT'}
                                        value={formData.maxDiscountAmount}
                                        onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })} placeholder="Không giới hạn" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Đơn tối thiểu (đ)</label>
                                    <input type="number" className={inputCls} value={formData.minOrderValue}
                                        onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Áp dụng cho</label>
                                    <select className={inputCls + ' bg-white'} value={formData.applyType}
                                        onChange={e => setFormData({ ...formData, applyType: e.target.value })}>
                                        <option value="ORDER">Toàn bộ đơn hàng</option>
                                        <option value="PRODUCT">Sản phẩm cụ thể</option>
                                    </select>
                                    {formData.applyType === 'PRODUCT' && (
                                        <p className="text-sm text-orange-600 mt-1">
                                            Sau khi tạo, dùng nút Gán SP (🏷) để chọn sản phẩm áp dụng.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Giới hạn sử dụng</label>
                                    <input type="number" className={inputCls} value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} placeholder="Không giới hạn" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Ngày bắt đầu</label>
                                    <DatePicker selected={formData.startDate} onChange={d => setFormData({ ...formData, startDate: d })}
                                        showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd/MM/yyyy HH:mm" locale={vi}
                                        placeholderText="Chọn ngày..." className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">Ngày kết thúc</label>
                                    <DatePicker selected={formData.endDate} onChange={d => setFormData({ ...formData, endDate: d })}
                                        showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd/MM/yyyy HH:mm" locale={vi}
                                        placeholderText="Chọn ngày..." minDate={formData.startDate} className={inputCls} />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-3 bg-purple-50 p-3.5 rounded-xl border border-purple-100">
                                    <input type="checkbox" id="isActive" className="w-4 h-4 accent-purple-600 cursor-pointer"
                                        checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                    <label htmlFor="isActive" className="text-md font-bold text-purple-900 cursor-pointer">Kích hoạt ngay sau khi tạo</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-5 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-md cursor-pointer">Hủy</button>
                                <button type="submit" disabled={saving}
                                    className="px-6 py-2.5 text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-xl font-semibold text-md cursor-pointer shadow-sm">
                                    {saving ? 'Đang lưu...' : editingCoupon ? 'Lưu thay đổi' : 'Tạo mã ngay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PRODUCT MAPPING MODAL — NEW */}
            {mappingCoupon && (
                <CouponProductMappingModal
                    coupon={mappingCoupon}
                    onClose={() => setMappingCoupon(null)}
                    onSaveSuccess={() => fetchCoupons(page)}
                />
            )}
        </div>
    );
}