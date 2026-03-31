"use client";

import React, { useState, useEffect } from 'react';
import { X, Star, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getReviewStatusByOrder, submitReviewFromOrder } from '@/services/reviewService';
import { toast } from 'react-toastify';

// ================================================================
// SUB-COMPONENT: Star Picker
// ================================================================
const StarPicker = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className={`text-2xl transition-transform hover:scale-110 cursor-pointer select-none
                    ${star <= value ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}
            >
                ★
            </button>
        ))}
    </div>
);

// ================================================================
// SUB-COMPONENT: Badge trạng thái review
// ================================================================
const ReviewStatusBadge = ({ status }) => {
    if (!status) return null;
    const map = {
        PENDING: { label: 'Chờ duyệt', icon: <Clock size={12} />, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        APPROVED: { label: 'Đã duyệt', icon: <CheckCircle size={12} />, cls: 'bg-green-50 text-green-700 border-green-200' },
        REJECTED: { label: 'Bị từ chối', icon: <XCircle size={12} />, cls: 'bg-red-50 text-red-700 border-red-200' },
    };
    const { label, icon, cls } = map[status] || {};
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold border rounded-full ${cls}`}>
            {icon}{label}
        </span>
    );
};

// ================================================================
// MAIN COMPONENT: OrderReviewModal
// Sử dụng trong trang Order History hoặc Profile page
//
// Props:
//   orderId   — ID của đơn hàng
//   onClose   — callback đóng modal
// ================================================================
const OrderReviewModal = ({ orderId, onClose }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // formState: { [skuId]: { rating, comment } }
    const [formState, setFormState] = useState({});
    // submitting: { [skuId]: boolean }
    const [submitting, setSubmitting] = useState({});

    // ----------------------------------------------------------------
    // Load trạng thái review của từng item
    // ----------------------------------------------------------------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getReviewStatusByOrder(orderId);
                setItems(data || []);

                // Pre-fill form nếu đã có review (để sửa)
                const initial = {};
                data.forEach(item => {
                    initial[item.skuId] = {
                        rating: item.existingRating || 5,
                        comment: item.existingComment || '',
                    };
                });
                setFormState(initial);
            } catch (err) {
                toast.error("Không thể tải thông tin đánh giá");
            } finally {
                setLoading(false);
            }
        };
        if (orderId) load();
    }, [orderId]);

    // ----------------------------------------------------------------
    // Submit 1 item
    // ----------------------------------------------------------------
    const handleSubmit = async (item) => {
        const form = formState[item.skuId];
        if (!form?.comment?.trim()) {
            toast.error("Vui lòng nhập nội dung đánh giá");
            return;
        }

        setSubmitting(prev => ({ ...prev, [item.skuId]: true }));
        try {
            await submitReviewFromOrder({
                orderId,
                skuId: item.skuId,
                productId: item.productId,
                rating: form.rating,
                comment: form.comment.trim(),
            });

            toast.success(item.reviewed ? "Đã cập nhật đánh giá, chờ admin duyệt" : "Đã gửi đánh giá, chờ admin duyệt");

            // Reload để cập nhật trạng thái
            const refreshed = await getReviewStatusByOrder(orderId);
            setItems(refreshed);
        } catch (err) {
            const msg = err?.response?.data?.message || "Không thể gửi đánh giá";
            toast.error(msg);
        } finally {
            setSubmitting(prev => ({ ...prev, [item.skuId]: false }));
        }
    };

    const updateForm = (skuId, field, value) => {
        setFormState(prev => ({
            ...prev,
            [skuId]: { ...prev[skuId], [field]: value },
        }));
    };

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------
    return (
        /* Backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Đánh giá đơn hàng #{orderId}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Đánh giá từng sản phẩm bạn đã nhận được</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-gray-900">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">Không có sản phẩm nào để đánh giá.</p>
                    ) : items.map(item => {
                        const form = formState[item.skuId] || { rating: 5, comment: '' };
                        const isSubmitting = submitting[item.skuId];

                        return (
                            <div key={item.skuId} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
                                {/* Product info */}
                                <div className="flex items-start gap-4 mb-4">
                                    {item.thumbnailUrl && (
                                        <img src={item.thumbnailUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 truncate">{item.productName}</div>
                                        {item.skuName && (
                                            <div className="text-sm text-gray-500 mt-0.5">{item.skuName}</div>
                                        )}
                                        {item.reviewed && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <ReviewStatusBadge status={item.reviewStatus} />
                                                <span className="text-xs text-gray-400">Đã đánh giá — bạn có thể cập nhật bên dưới</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="mb-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Đánh giá của bạn</label>
                                    <StarPicker value={form.rating} onChange={v => updateForm(item.skuId, 'rating', v)} />
                                </div>

                                {/* Comment */}
                                <div className="mb-4">
                                    <textarea
                                        value={form.comment}
                                        onChange={e => updateForm(item.skuId, 'comment', e.target.value)}
                                        placeholder="Chia sẻ trải nghiệm của bạn — chất liệu, size, màu sắc, đóng gói..."
                                        rows={3}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none bg-gray-50 hover:bg-white transition-colors placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={() => handleSubmit(item)}
                                    disabled={isSubmitting || !form.comment.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                                >
                                    {isSubmitting
                                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang gửi...</>
                                        : <><Send size={14} /> {item.reviewed ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</>
                                    }
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Đánh giá sẽ hiển thị sau khi được admin duyệt.</p>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-700 border border-gray-300 rounded-xl hover:bg-white transition-colors cursor-pointer">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderReviewModal;