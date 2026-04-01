"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    approveReview, rejectReview, bulkApprove, bulkReject, getPendingWithFilter
} from '@/services/reviewService';

const STAR = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function AdminReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(new Set());
    const [working, setWorking] = useState(new Set());
    const [bulkWorking, setBulk] = useState(false);
    const [modal, setModal] = useState(null);
    const [filters, setFilters] = useState({
        productName: '', minRating: '', fromDate: '', page: 0, size: 20
    });
    const [totalPages, setTotal] = useState(0);
    const searchTimeout = useRef(null);

    const load = useCallback(async (f = filters) => {
        setLoading(true);
        try {
            const params = { page: f.page, size: f.size };
            if (f.productName) params.productName = f.productName;
            if (f.minRating) params.minRating = f.minRating;
            if (f.fromDate) params.fromDate = f.fromDate + 'T00:00:00';

            const data = await getPendingWithFilter(params);
            setReviews(data?.content ?? []);
            setTotal(data?.totalPages ?? 0);
            setSelected(new Set());
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không tải được danh sách');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { load(); }, []);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value, page: 0 };
        setFilters(newFilters);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => load(newFilters), 400);
    };

    const toggleRow = (id) =>
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleAll = (checked) =>
        setSelected(checked ? new Set(reviews.map(r => r.id)) : new Set());

    const confirm = (title, body, onConfirm) =>
        setModal({ title, body, onConfirm });

    const executeSingle = async (id, action) => {
        setWorking(prev => new Set(prev).add(id));
        try {
            action === 'approve' ? await approveReview(id) : await rejectReview(id);
            toast.success(action === 'approve' ? 'Đã duyệt' : 'Đã từ chối');
            await load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setWorking(prev => { const n = new Set(prev); n.delete(id); return n; });
        }
    };

    const executeBulk = async (action) => {
        const ids = [...selected];
        setBulk(true);
        try {
            action === 'approve' ? await bulkApprove(ids) : await bulkReject(ids);
            toast.success(
                action === 'approve'
                    ? `Đã duyệt ${ids.length} đánh giá`
                    : `Đã từ chối ${ids.length} đánh giá`
            );
            await load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Thao tác hàng loạt thất bại');
        } finally {
            setBulk(false);
        }
    };

    const allSelected = reviews.length > 0 && reviews.every(r => selected.has(r.id));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Duyệt đánh giá sản phẩm</h1>
                    <p className="text-md text-gray-500 mt-0.5">
                        {selected.size > 0
                            ? `Đã chọn ${selected.size} / ${reviews.length} đánh giá`
                            : `${reviews.length} đánh giá đang chờ duyệt`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={selected.size === 0 || bulkWorking}
                        onClick={() => confirm(
                            'Duyệt hàng loạt',
                            `Bạn có chắc muốn duyệt ${selected.size} đánh giá đã chọn?`,
                            () => executeBulk('approve')
                        )}
                        className="px-4 py-2 text-md font-medium rounded-lg bg-emerald-50 text-emerald-700
                       border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {bulkWorking ? '...' : `Duyệt đã chọn (${selected.size})`}
                    </button>
                    <button
                        disabled={selected.size === 0 || bulkWorking}
                        onClick={() => confirm(
                            'Từ chối hàng loạt',
                            `Bạn có chắc muốn từ chối ${selected.size} đánh giá đã chọn?`,
                            () => executeBulk('reject')
                        )}
                        className="px-4 py-2 text-md font-medium rounded-lg bg-rose-50 text-rose-700
                       border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {bulkWorking ? '...' : `Từ chối đã chọn (${selected.size})`}
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6 space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                    {/* Tìm kiếm tên */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Sản phẩm</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm tên sản phẩm..."
                                value={filters.productName}
                                onChange={e => handleFilterChange('productName', e.target.value)}
                                className="w-full pl-3 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-md focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Lọc số sao */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Đánh giá tối thiểu</label>
                        <select
                            value={filters.minRating}
                            onChange={e => handleFilterChange('minRating', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-md focus:border-gray-900 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả mức sao</option>
                            {[5, 4, 3, 2, 1].map(n => (
                                <option key={n} value={n}>{n} sao trở lên ({'★'.repeat(n)})</option>
                            ))}
                        </select>
                    </div>

                    {/* Lọc ngày tháng */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Từ ngày</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={e => handleFilterChange('fromDate', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-md focus:border-gray-900 outline-none transition-all shadow-sm cursor-pointer"
                        />
                    </div>

                    {/* Nút Xóa lọc */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const f = { productName: '', minRating: '', fromDate: '', page: 0, size: 20 };
                                setFilters(f); load(f);
                            }}
                            className="flex-1 h-10.5 text-md font-bold border border-gray-200 text-gray-600 rounded-lg hover:bg-white hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm uppercase tracking-widest bg-white cursor-pointer"
                        >
                            Xóa lọc
                        </button>

                        {/* Nút làm mới nhanh */}
                        <button
                            onClick={() => load()}
                            className="w-10.5 h-10.5 flex items-center justify-center border border-gray-200 text-gray-600 rounded-lg hover:bg-white hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm bg-white cursor-pointer"
                            title="Tải lại dữ liệu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <p className="text-gray-400 text-md py-8 text-center">Đang tải...</p>
            ) : reviews.length === 0 ? (
                <p className="text-gray-400 text-md py-8 text-center">Không có đánh giá nào.</p>
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="min-w-full text-md">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-3 w-8 pl-5">
                                    <input type="checkbox" checked={allSelected}
                                        onChange={e => toggleAll(e.target.checked)} />
                                </th>
                                <th className="p-3 text-left font-medium text-gray-500">Sản phẩm / SKU</th>
                                <th className="p-3 text-left font-medium text-gray-500">Người dùng</th>
                                <th className="p-3 text-center font-medium text-gray-500">Sao</th>
                                <th className="p-3 text-left font-medium text-gray-500">Nội dung</th>
                                <th className="p-3 text-left font-medium text-gray-500">Ngày</th>
                                <th className="p-3 text-right font-medium text-gray-500 pr-5">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(r => {
                                const isWorking = working.has(r.id);
                                const isSelected = selected.has(r.id);
                                return (
                                    <tr key={r.id}
                                        className={`border-t border-gray-100 align-top
                      ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="p-3 pl-5">
                                            <input type="checkbox" checked={isSelected}
                                                onChange={() => toggleRow(r.id)} />
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium text-gray-900">{r.product?.name}</div>
                                            <div className="text-sm text-gray-500 mt-0.5">
                                                {r.sku?.optionSummary}
                                            </div>
                                            {r.orderId && (
                                                <div className="text-sm text-blue-600 font-medium mt-1">
                                                    Đơn hàng: #{r.orderId}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold shrink-0">
                                                    {r.user?.fullName ? r.user.fullName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <span className="text-gray-800">{r.user?.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`font-medium ${r.rating >= 4 ? 'text-emerald-600'
                                                : r.rating === 3 ? 'text-amber-500'
                                                    : 'text-rose-500'}`}>
                                                {STAR(r.rating)}
                                            </span>
                                        </td>
                                        <td className="p-3 max-w-xs">
                                            <p className="text-gray-700 line-clamp-2">{r.comment}</p>
                                            {r.verifiedPurchase && (
                                                <span className="inline-block mt-1 text-sm px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">Đã mua hàng</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-sm text-gray-500 whitespace-nowrap">
                                            {r.createdAt?.slice(0, 10)}
                                        </td>
                                        <td className="p-3 pr-5">
                                            <div className="flex gap-2 justify-end">
                                                <button disabled={isWorking}
                                                    onClick={() => confirm(
                                                        'Xác nhận duyệt',
                                                        `Duyệt đánh giá của ${r.user?.fullName}?`,
                                                        () => executeSingle(r.id, 'approve')
                                                    )}
                                                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                                                    {isWorking ? '...' : 'Duyệt'}
                                                </button>
                                                <button disabled={isWorking}
                                                    onClick={() => confirm(
                                                        'Xác nhận từ chối',
                                                        `Từ chối đánh giá của ${r.user?.fullName}?`,
                                                        () => executeSingle(r.id, 'reject')
                                                    )}
                                                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50">
                                                    {isWorking ? '...' : 'Từ chối'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center gap-3 mt-6 justify-center">
                    <button disabled={filters.page === 0}
                        onClick={() => handleFilterChange('page', filters.page - 1)}
                        className="px-3 py-1.5 text-md border border-gray-200 rounded-lg disabled:opacity-40">
                        ← Trang trước
                    </button>
                    <span className="text-md text-gray-500">
                        Trang {filters.page + 1} / {totalPages}
                    </span>
                    <button disabled={filters.page >= totalPages - 1}
                        onClick={() => handleFilterChange('page', filters.page + 1)}
                        className="px-3 py-1.5 text-md border border-gray-200 rounded-lg disabled:opacity-40">
                        Trang sau →
                    </button>
                </div>
            )}

            {/* Confirmation modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold mb-2">{modal.title}</h3>
                        <p className="text-md text-gray-500 mb-6">{modal.body}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setModal(null)}
                                className="px-4 py-2 text-md border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
                            <button
                                onClick={() => { setModal(null); modal.onConfirm(); }}
                                className="px-4 py-2 text-md font-medium rounded-lg bg-gray-900 text-white hover:bg-black">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}