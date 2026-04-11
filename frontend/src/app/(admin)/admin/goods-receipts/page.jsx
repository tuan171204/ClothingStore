'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Eye, X, CheckCircle, Clock, PackageOpen, ShieldCheck, Edit2, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { getAllGoodsReceipts, getGoodsReceiptById, confirmGoodsReceipt } from '@/services/goodsReceiptService';
import Pagination from '@/components/admin/Pagination';

const PAGE_SIZE = 10;

const formatCurrency = (amount) =>
    amount != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : '—';

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateString));
};

export default function GoodsReceiptsPage() {
    const { adminUser } = useAdminAuth();

    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const canConfirm = adminUser?.role?.name === 'ADMIN' || adminUser?.role?.name === 'SUPER_ADMIN';

    const fetchReceipts = useCallback(async (pg = page) => {
        setLoading(true);
        try {
            const res = await getAllGoodsReceipts({
                status: statusFilter || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                page: pg,
                size: PAGE_SIZE,
            });
            const result = res?.result;
            if (result && typeof result === 'object' && 'content' in result) {
                setData(result);
            } else if (Array.isArray(result)) {
                setData({ content: result, totalElements: result.length, totalPages: 1 });
            } else {
                setData({ content: [], totalElements: 0, totalPages: 0 });
            }
        } catch {
            toast.error('Lỗi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, fromDate, toDate, page]);

    useEffect(() => { fetchReceipts(page); }, [page]);

    const applyFilters = () => { setPage(0); fetchReceipts(0); };
    const resetFilters = () => {
        setStatusFilter(''); setFromDate(''); setToDate(''); setPage(0);
        setTimeout(() => fetchReceipts(0), 0);
    };

    const hasActiveFilters = statusFilter || fromDate || toDate;

    const handleViewDetails = async (id) => {
        setIsModalOpen(true);
        setLoadingDetail(true);
        try {
            const res = await getGoodsReceiptById(id);
            if (res?.result) setSelectedReceipt(res.result);
            else { toast.error('Không tải được chi tiết!'); setIsModalOpen(false); }
        } catch {
            toast.error('Có lỗi xảy ra!');
            setIsModalOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleConfirmReceipt = async () => {
        if (!selectedReceipt) return;
        if (!window.confirm('Xác nhận duyệt phiếu này? Tồn kho và giá nhập sẽ được cập nhật!')) return;
        setConfirming(true);
        try {
            await confirmGoodsReceipt(selectedReceipt.id);
            toast.success('Đã duyệt phiếu nhập kho thành công!');
            setIsModalOpen(false);
            fetchReceipts(page);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi duyệt phiếu!');
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-0">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <PackageOpen size={22} className="text-blue-600" /> Quản lý Nhập kho (GRN)
                </h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters(p => !p)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex-1 sm:flex-none justify-center
                            ${showFilters || hasActiveFilters
                                ? 'bg-blue-50 border-blue-400 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter size={15} />
                        Bộ lọc {hasActiveFilters && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">!</span>}
                    </button>
                    <Link
                        href="/admin/goods-receipts/create"
                        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium flex-1 sm:flex-none justify-center"
                    >
                        <Plus size={16} /> Tạo phiếu nhập
                    </Link>
                </div>
            </div>

            {/* FILTER PANEL */}
            {showFilters && (
                <div className="bg-white border border-blue-100 rounded-xl p-4 mb-4 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Trạng thái</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PENDING">⏳ Chờ duyệt</option>
                                <option value="CONFIRMED">✅ Đã nhập kho</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Từ ngày</label>
                            <input type="date"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                value={fromDate} onChange={e => setFromDate(e.target.value)} max={toDate || undefined}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Đến ngày</label>
                            <input type="date"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate || undefined}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                        <button onClick={applyFilters}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                            Áp dụng bộ lọc
                        </button>
                        <button onClick={resetFilters}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            )}

            {/* TABLE — mobile cards, desktop table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Mobile: card list */}
                <div className="block sm:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Đang tải dữ liệu...</div>
                    ) : data.content.length > 0 ? (
                        data.content.map((grn) => (
                            <div key={grn.id} className="p-3 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="font-semibold text-gray-700 text-sm">GRN-{String(grn.id).padStart(4, '0')}</span>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(grn.createdAt)}</p>
                                    </div>
                                    {grn.status === 'PENDING' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            <Clock size={10} /> Chờ duyệt
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle size={10} /> Đã nhập kho
                                        </span>
                                    )}
                                </div>
                                {grn.note && <p className="text-xs text-gray-500 mb-2 italic truncate">"{grn.note}"</p>}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-blue-600 font-medium">Tổng SL: {grn.totalReceived}</span>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleViewDetails(grn.id)}
                                            className="text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                                            <Eye size={14} />
                                        </button>
                                        {grn.status === 'PENDING' && (
                                            <Link href={`/admin/goods-receipts/${grn.id}/edit`}
                                                className="text-gray-600 hover:text-amber-600 bg-gray-100 hover:bg-amber-50 p-1.5 rounded-lg transition-colors">
                                                <Edit2 size={14} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy phiếu nhập nào.</div>
                    )}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block">
                    <table className="w-full border-collapse text-md text-center">
                        <thead className="bg-gray-50 text-gray-600 border-b uppercase text-sm">
                            <tr>
                                <th className="p-4">Mã Phiếu</th>
                                <th className="p-4 text-left">Ghi chú</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4">Ngày tạo</th>
                                <th className="p-4">Tổng SL</th>
                                <th className="p-4">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                            ) : data.content.length > 0 ? (
                                data.content.map((grn) => (
                                    <tr key={grn.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-semibold text-gray-700">GRN-{String(grn.id).padStart(4, '0')}</td>
                                        <td className="p-4 text-left max-w-xs truncate text-gray-600" title={grn.note}>
                                            {grn.note || <span className="italic text-gray-400">Không có ghi chú</span>}
                                        </td>
                                        <td className="p-4">
                                            {grn.status === 'PENDING' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                                                    <Clock size={12} /> Chờ duyệt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                    <CheckCircle size={12} /> Đã nhập kho
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">{formatDate(grn.createdAt)}</td>
                                        <td className="p-4 font-medium text-blue-600">{grn.totalReceived}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleViewDetails(grn.id)}
                                                    className="text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                                    <Eye size={16} />
                                                </button>
                                                {grn.status === 'PENDING' && (
                                                    <Link href={`/admin/goods-receipts/${grn.id}/edit`}
                                                        className="text-gray-600 hover:text-amber-600 bg-gray-100 hover:bg-amber-50 p-2 rounded-lg transition-colors">
                                                        <Edit2 size={16} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Không tìm thấy phiếu nhập nào.</td></tr>
                            )}
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
            </div>

            {/* DETAIL MODAL — bottom sheet on mobile */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-4 sm:p-5 border-b bg-gray-50">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                    Chi tiết GRN-{String(selectedReceipt?.id || '').padStart(4, '0')}
                                </h2>
                                <p className="text-xs sm:text-md text-gray-500 mt-0.5">{selectedReceipt ? formatDate(selectedReceipt.createdAt) : '...'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            {loadingDetail ? (
                                <div className="flex justify-center items-center h-32 text-gray-500">Đang tải chi tiết...</div>
                            ) : selectedReceipt && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100 text-sm sm:text-md">
                                        <div>
                                            <span className="block text-gray-500 mb-1 text-xs">Trạng thái</span>
                                            <span className={`font-semibold ${selectedReceipt.status === 'PENDING' ? 'text-amber-600' : 'text-green-600'}`}>
                                                {selectedReceipt.status === 'PENDING' ? '⏳ Chờ duyệt' : '✅ Đã nhập kho'}
                                            </span>
                                        </div>
                                        <div><span className="block text-gray-500 mb-1 text-xs">Tổng SL Nhận</span><span className="font-semibold text-gray-800">{selectedReceipt.totalReceived}</span></div>
                                        <div><span className="block text-gray-500 mb-1 text-xs">Đạt QC</span><span className="font-semibold text-green-600">{selectedReceipt.totalPassed}</span></div>
                                        <div><span className="block text-gray-500 mb-1 text-xs">Lỗi QC</span><span className="font-semibold text-red-600">{selectedReceipt.totalFailed}</span></div>
                                        {selectedReceipt.note && (
                                            <div className="col-span-2 sm:col-span-4"><span className="block text-gray-500 mb-1 text-xs">Ghi chú</span><span className="text-gray-700 italic text-sm">"{selectedReceipt.note}"</span></div>
                                        )}
                                    </div>

                                    {/* Items — scroll horizontally on mobile */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-center min-w-[500px]">
                                                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                                                    <tr>
                                                        <th className="p-3 text-left">Sản phẩm / SKU</th>
                                                        <th className="p-3">SL Nhận</th>
                                                        <th className="p-3 text-green-600">Đạt</th>
                                                        <th className="p-3 text-red-600">Lỗi</th>
                                                        <th className="p-3 text-blue-600">Giá nhập</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {selectedReceipt.items?.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="p-3 text-left">
                                                                <div className="font-medium text-gray-800 text-xs sm:text-sm">{item.productName || 'N/A'}</div>
                                                                {item.skuName && <div className="text-xs text-gray-500">{item.skuName}</div>}
                                                            </td>
                                                            <td className="p-3 text-xs sm:text-sm">{item.quantityReceived}</td>
                                                            <td className="p-3 font-medium text-green-600 text-xs sm:text-sm">{item.quantityPassed}</td>
                                                            <td className="p-3 font-medium text-red-600 text-xs sm:text-sm">{item.quantityFailed}</td>
                                                            <td className="p-3 font-medium text-blue-700 text-xs sm:text-sm">{formatCurrency(item.importPrice)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 sm:p-5 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                                {selectedReceipt?.status === 'PENDING' && canConfirm && (
                                    <span className="text-amber-600 font-medium">⚠️ Sau khi duyệt, giá nhập bình quân sẽ được tính tự động</span>
                                )}
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button onClick={() => setIsModalOpen(false)}
                                    className="flex-1 sm:flex-none px-5 py-2.5 text-gray-600 bg-white border hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm">
                                    Đóng
                                </button>
                                {selectedReceipt?.status === 'PENDING' && canConfirm && (
                                    <button onClick={handleConfirmReceipt} disabled={confirming}
                                        className="flex-1 sm:flex-none px-5 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-green-400 text-sm">
                                        {confirming ? 'Đang xử lý...' : <><ShieldCheck size={16} /> Duyệt & Nhập Kho</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}