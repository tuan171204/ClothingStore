'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, X, CheckCircle, Clock, PackageOpen, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { getAllGoodsReceipts, getGoodsReceiptById, confirmGoodsReceipt } from '@/services/goodsReceiptService';

export default function GoodsReceiptsPage() {
    const { adminUser } = useAdminAuth();
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Lấy danh sách phiếu nhập
    const fetchReceipts = async () => {
        setLoading(true);
        const data = await getAllGoodsReceipts();
        setReceipts(data.result || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchReceipts();
    }, []);

    // Format ngày giờ đẹp
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(date);
    };

    // Kiểm tra quyền Duyệt phiếu (Chỉ ADMIN và SUPER_ADMIN)
    const canConfirm = adminUser?.role?.name === 'ADMIN' || adminUser?.role?.name === 'SUPER_ADMIN';

    // Mở Modal xem chi tiết
    const handleViewDetails = async (id) => {
        setIsModalOpen(true);
        setLoadingDetail(true);
        try {
            const data = await getGoodsReceiptById(id);
            if (data?.result) {
                setSelectedReceipt(data.result);
            } else {
                toast.error("Không tải được chi tiết phiếu nhập!");
                setIsModalOpen(false);
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lấy chi tiết!");
            setIsModalOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Xử lý Duyệt Phiếu
    const handleConfirmReceipt = async () => {
        if (!selectedReceipt) return;
        if (!window.confirm("Bạn có chắc chắn muốn duyệt phiếu này? Số lượng tồn kho sẽ được cộng thêm ngay lập tức và không thể hoàn tác!")) {
            return;
        }

        setConfirming(true);
        try {
            await confirmGoodsReceipt(selectedReceipt.id);
            toast.success("Đã duyệt phiếu nhập kho thành công!");
            setIsModalOpen(false);
            fetchReceipts(); // Refresh lại danh sách bên ngoài
        } catch (error) {
            toast.error(error.message || "Lỗi khi duyệt phiếu!");
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="max-w mx-auto relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <PackageOpen size={24} className="text-blue-600" /> Quản lý Nhập kho (GRN)
                </h1>
                <Link
                    href="/admin/goods-receipts/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Tạo phiếu nhập
                </Link>
            </div>

            {/* Bảng danh sách phiếu nhập */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full border-collapse font-sans text-center text-md">
                    <thead className="bg-gray-50 text-gray-600 border-b uppercase">
                        <tr>
                            <th className="p-4 border-b">Mã Phiếu</th>
                            <th className="p-4 border-b text-left">Ghi chú</th>
                            <th className="p-4 border-b">Trạng thái</th>
                            <th className="p-4 border-b">Ngày tạo</th>
                            <th className="p-4 border-b">Tổng SL Nhận</th>
                            <th className="p-4 border-b">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                        ) : receipts.length > 0 ? (
                            receipts.map((grn) => (
                                <tr key={grn.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-semibold text-gray-700">GRN-{grn.id}</td>
                                    <td className="p-4 text-left max-w-xs truncate text-gray-600" title={grn.note}>
                                        {grn.note || "Không có ghi chú"}
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
                                    <td className="p-4 text-gray-500">{formatDate(grn.createdAt)}</td>
                                    <td className="p-4 font-medium text-blue-600">{grn.totalReceived}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleViewDetails(grn.id)}
                                            className="text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 p-2 rounded-lg transition-colors inline-flex items-center justify-center"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-400">Chưa có phiếu nhập kho nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Chi Tiết Phiếu Nhập */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Chi tiết phiếu nhập #GRN-{selectedReceipt?.id}</h2>
                                <p className="text-md text-gray-500 mt-1">Ngày tạo: {selectedReceipt ? formatDate(selectedReceipt.createdAt) : '...'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingDetail ? (
                                <div className="flex justify-center items-center h-32 text-gray-500">Đang tải chi tiết...</div>
                            ) : selectedReceipt && (
                                <div className="space-y-6">
                                    {/* Info Panel */}
                                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-md">
                                        <div>
                                            <span className="block text-gray-500 mb-1">Trạng thái</span>
                                            <span className={`font-semibold ${selectedReceipt.status === 'PENDING' ? 'text-amber-600' : 'text-green-600'}`}>
                                                {selectedReceipt.status === 'PENDING' ? 'Chờ duyệt' : 'Đã nhập kho'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 mb-1">Tổng SL Nhận</span>
                                            <span className="font-semibold text-gray-800">{selectedReceipt.totalReceived}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 mb-1">Tổng SL Đạt (QC)</span>
                                            <span className="font-semibold text-green-600">{selectedReceipt.totalPassed}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 mb-1">Tổng SL Lỗi</span>
                                            <span className="font-semibold text-red-600">{selectedReceipt.totalFailed}</span>
                                        </div>
                                        <div className="col-span-2 md:col-span-4">
                                            <span className="block text-gray-500 mb-1">Ghi chú</span>
                                            <span className="text-gray-700 italic">{selectedReceipt.note || "Không có"}</span>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-3">Danh sách sản phẩm nhập ({selectedReceipt.items?.length || 0} mục)</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-md text-center">
                                                <thead className="bg-gray-100 text-gray-600">
                                                    <tr>
                                                        <th className="p-3 text-left">Sản phẩm (SKU)</th>
                                                        <th className="p-3">Mã SKU</th>
                                                        <th className="p-3">SL Nhận</th>
                                                        <th className="p-3 text-green-600">Đạt (Pass)</th>
                                                        <th className="p-3 text-red-600">Lỗi (Fail)</th>
                                                        <th className="p-3">Tỷ lệ lỗi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {selectedReceipt.items?.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="p-3 text-left font-medium text-gray-800">{item.productName || 'N/A'}</td>
                                                            <td className="p-3 text-gray-500">{item.skuCode}</td>
                                                            <td className="p-3">{item.quantityReceived}</td>
                                                            <td className="p-3 font-medium text-green-600">{item.quantityPassed}</td>
                                                            <td className="p-3 font-medium text-red-600">{item.quantityFailed}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-1 rounded-md text-sm ${item.defectRate > 0.1 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {(item.defectRate * 100).toFixed(1)}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer - Nút Hành động */}
                        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 text-gray-600 bg-white border hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Đóng
                            </button>

                            {/* Logic hiển thị nút Duyệt: Chỉ Phiếu PENDING và có quyền ADMIN+ */}
                            {selectedReceipt?.status === 'PENDING' && canConfirm && (
                                <button
                                    onClick={handleConfirmReceipt}
                                    disabled={confirming}
                                    className="px-5 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:bg-green-400"
                                >
                                    {confirming ? 'Đang xử lý...' : <><ShieldCheck size={18} /> Duyệt & Nhập Kho</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}