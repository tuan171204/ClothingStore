'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { cancelOrder } from '@/services/orderService';

// ─── Danh sách lý do hủy đơn ──────────────────────────────────
const CANCEL_REASONS = [
    { value: 'Thay đổi ý định, không muốn mua nữa', label: 'Thay đổi ý định, không muốn mua nữa' },
    { value: 'Muốn thay đổi địa chỉ giao hàng', label: 'Muốn thay đổi địa chỉ giao hàng' },
    { value: 'Muốn thay đổi sản phẩm (màu/size)', label: 'Muốn thay đổi sản phẩm (màu/size)' },
    { value: 'Tìm được giá tốt hơn ở nơi khác', label: 'Tìm được giá tốt hơn ở nơi khác' },
    { value: 'Đặt nhầm sản phẩm', label: 'Đặt nhầm sản phẩm' },
    { value: 'Khác', label: 'Khác (nhập lý do bên dưới)' },
];

/**
 * Modal hủy đơn hàng.
 *
 * Props:
 *   order    — object đơn hàng { id, status, ... }
 *   onClose  — callback đóng modal
 *   onSuccess — callback sau khi hủy thành công (để reload danh sách đơn)
 */
const CancelOrderModal = ({ order, onClose, onSuccess }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form'); // 'form' | 'confirm'

    const finalReason = selectedReason === 'Khác' ? customReason.trim() : selectedReason;
    const isValid = finalReason.length >= 5;

    const handleSubmit = async () => {
        if (!isValid) {
            toast.error('Vui lòng chọn hoặc nhập lý do hủy đơn (tối thiểu 5 ký tự).');
            return;
        }
        if (step === 'form') {
            setStep('confirm');
            return;
        }

        setLoading(true);
        try {
            await cancelOrder(order.id, finalReason);
            toast.success(`Đơn hàng #${order.id} đã được hủy thành công.`);
            onSuccess?.();
            onClose();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.';
            toast.error(msg);
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle size={18} className="text-red-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-base">Hủy đơn hàng #{order.id}</h2>
                            <p className="text-sm text-red-600 font-medium mt-0.5">Hành động này không thể hoàn tác</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {step === 'form' ? (
                        <div className="space-y-4">
                            <p className="text-md text-gray-600 leading-relaxed">
                                Bạn sắp hủy đơn hàng <strong className="text-gray-900">#{order.id}</strong>.
                                Tồn kho sẽ được hoàn trả tự động sau khi hủy.
                            </p>

                            {/* Dropdown lý do */}
                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    Lý do hủy đơn <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedReason}
                                        onChange={e => {
                                            setSelectedReason(e.target.value);
                                            setCustomReason('');
                                        }}
                                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-md text-gray-700 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                                    >
                                        <option value="">-- Chọn lý do --</option>
                                        {CANCEL_REASONS.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Textarea khi chọn "Khác" */}
                            {selectedReason === 'Khác' && (
                                <div>
                                    <label className="block text-md font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                        Nhập lý do cụ thể <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={customReason}
                                        onChange={e => setCustomReason(e.target.value)}
                                        placeholder="Mô tả ngắn gọn lý do bạn muốn hủy đơn..."
                                        rows={3}
                                        maxLength={500}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-md bg-gray-50 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none transition-all placeholder:text-gray-400"
                                    />
                                    <p className="text-sm text-gray-400 mt-1 text-right">{customReason.length}/500</p>
                                </div>
                            )}

                            {/* Cảnh báo nếu đơn đã được xác nhận hoặc đã đẩy sang GHN
                            {(order.status === 'CONFIRMED' || order.status === 'SHIPPING') && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        Đơn hàng đã được ghi nhận. Nếu đơn vận chuyển chưa được tạo trên GHN,
                                        hủy sẽ thành công ngay. Nếu đã có mã vận đơn, hệ thống sẽ tự động thông báo hủy cho bưu cục GHN.
                                    </p>
                                </div>
                            )} */}
                        </div>
                    ) : (
                        // Bước xác nhận lần cuối
                        <div className="space-y-4 text-center py-2">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={28} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base mb-1">Xác nhận hủy đơn?</h3>
                                <p className="text-md text-gray-600">Lý do: <span className="font-semibold text-gray-800">"{finalReason}"</span></p>
                            </div>
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                                Sau khi hủy, tồn kho sẽ được hoàn trả tự động và bạn sẽ nhận được email xác nhận.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-3">
                    <button
                        onClick={step === 'confirm' ? () => setStep('form') : onClose}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 text-md font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        {step === 'confirm' ? 'Quay lại' : 'Đóng'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !isValid}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-md font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {step === 'form' ? 'Tiếp tục' : 'Xác nhận hủy đơn'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelOrderModal;