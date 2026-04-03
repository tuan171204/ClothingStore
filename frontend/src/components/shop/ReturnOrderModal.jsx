'use client';

import React, { useState } from 'react';
import { X, ChevronDown, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { requestReturnOrder } from '@/services/orderService';
import ImageUpload from '@/components/common/ImageUpload';
import { uploadOrderImage } from '@/services/uploadService';

const RETURN_REASONS = [
    { value: 'DEFECTIVE', label: '🔧 Sản phẩm bị lỗi / hư hỏng' },
    { value: 'WRONG_ITEM', label: '📦 Nhận sai sản phẩm / màu / size' },
    { value: 'NOT_AS_DESCRIBED', label: '🖼️ Sản phẩm không giống mô tả / ảnh' },
    { value: 'CHANGED_MIND', label: '💭 Thay đổi ý định sau khi nhận' },
    { value: 'MISSING_PARTS', label: '🧩 Thiếu phụ kiện / phụ liệu đi kèm' },
    { value: 'OTHER', label: '📝 Lý do khác' },
];

const REASON_LABELS = Object.fromEntries(RETURN_REASONS.map(r => [r.value, r.label]));

const ReturnOrderModal = ({ order, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]); // Lưu trực tiếp mảng URL String
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form');

    const MAX_IMAGES = 5;
    const isValid = reason !== '' && description.trim().length >= 10 && images.length >= 1;

    // Xử lý khi ImageUpload trả về url mới hoặc bị xóa (url = '')
    const handleImageChange = (index, url) => {
        setImages(prev => {
            const newImages = [...prev];
            if (url) {
                newImages[index] = url; // Thêm hoặc cập nhật
            } else {
                newImages.splice(index, 1); // Bị xóa khỏi ImageUpload component
            }
            return newImages.filter(Boolean); // Lọc bỏ các slot rỗng
        });
    };

    const handleSubmit = async () => {
        if (!isValid) return toast.error('Vui lòng điền đủ thông tin và upload ít nhất 1 ảnh.');
        if (step === 'form') return setStep('confirm');

        setLoading(true);
        try {
            await requestReturnOrder(order.id, reason, description.trim(), images);
            toast.success('Yêu cầu hoàn trả đã được gửi! Chúng tôi sẽ xem xét trong 1–3 ngày.');
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể gửi yêu cầu.');
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <RotateCcw size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-base">Yêu cầu hoàn trả đơn #{order.id}</h2>
                            <p className="text-sm text-amber-700 font-medium mt-0.5">Trong vòng 7 ngày kể từ ngày đặt</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 'form' ? (
                        <div className="space-y-5">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                                <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Vui lòng cung cấp thông tin chính xác và ảnh bằng chứng rõ ràng để được xử lý nhanh hơn.
                                </p>
                            </div>

                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    Lý do <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select value={reason} onChange={e => setReason(e.target.value)} className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-md focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                                        <option value="">-- Chọn lý do --</option>
                                        {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    Mô tả (tối thiểu 10 ký tự) <span className="text-red-500">*</span>
                                </label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả cụ thể vấn đề..." rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-md focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none" />
                            </div>

                            {/* Khu vực dùng lại ImageUpload Component */}
                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    Ảnh bằng chứng <span className="text-red-500">*</span>
                                    <span className="text-gray-400 font-normal normal-case ml-1">(1–{MAX_IMAGES} ảnh)</span>
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {/* Render các slot đã có ảnh */}
                                    {images.map((url, idx) => (
                                        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-50">
                                            <ImageUpload
                                                currentImage={url}
                                                onUpload={(newUrl) => handleImageChange(idx, newUrl)}
                                                uploadFunc={uploadOrderImage}
                                            />
                                        </div>
                                    ))}
                                    {/* Render 1 slot trống để thêm ảnh mới (nếu chưa đạt tối đa) */}
                                    {images.length < MAX_IMAGES && (
                                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-amber-400 transition-colors bg-gray-50 flex items-center justify-center">
                                            <ImageUpload
                                                currentImage=""
                                                onUpload={(newUrl) => handleImageChange(images.length, newUrl)}
                                                uploadFunc={uploadOrderImage}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Bước xác nhận
                        <div className="space-y-4 py-2">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <RotateCcw size={28} className="text-amber-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">Xác nhận gửi yêu cầu?</h3>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-md">
                                <div className="flex gap-3"><span className="font-bold text-gray-500 w-20">Lý do:</span><span>{REASON_LABELS[reason]}</span></div>
                                <div className="flex gap-3"><span className="font-bold text-gray-500 w-20">Mô tả:</span><span>{description}</span></div>
                                <div className="flex gap-3"><span className="font-bold text-gray-500 w-20">Ảnh:</span>
                                    <div className="flex gap-1.5">
                                        {images.map((url, i) => <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex gap-3 shrink-0">
                    <button onClick={step === 'confirm' ? () => setStep('form') : onClose} className="flex-1 py-3 border border-gray-300 text-gray-700 text-md font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        {step === 'confirm' ? 'Quay lại' : 'Hủy bỏ'}
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !isValid} className="flex-1 py-3 bg-amber-400 hover:bg-amber-700 disabled:bg-amber-200 disabled:cursor-not-allowed text-black text-md font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
                        {step === 'form' ? 'Xem lại & Gửi' : 'Gửi yêu cầu hoàn trả'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnOrderModal;