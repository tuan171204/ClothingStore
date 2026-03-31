"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Heart, Plus, Minus, Ruler, MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/services/productService';
import { getApprovedReviewsByProduct } from '@/services/reviewService';
import { getCommentsByProduct, postComment, deleteComment } from '@/services/commentService';
import { useCart } from "@/context/CartContext";
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

// ================================================================
// SUB-COMPONENT: Hiển thị sao
// ================================================================
const StarDisplay = ({ rating, size = 'md' }) => {
    const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg';
    return (
        <span className={`${sizeClass} select-none`}>
            {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={star <= rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
            ))}
        </span>
    );
};

// ================================================================
// SUB-COMPONENT: 1 Comment item (có thể reply)
// ================================================================
const CommentItem = ({ comment, productId, currentUser, onReplySubmit, onDelete }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [showReplies, setShowReplies] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const avatarUrl = comment.userAvatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userDisplayName || 'U')}&background=e5e7eb&color=374151&bold=true&size=64`;

    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return;
        setSubmitting(true);
        try {
            await onReplySubmit(comment.id, replyContent.trim());
            setReplyContent('');
            setShowReplyForm(false);
        } finally {
            setSubmitting(false);
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div className="flex gap-3">
            <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5 border border-gray-100" />
            <div className="flex-1 min-w-0">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{comment.userDisplayName}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-4 mt-1.5 px-2">
                    {currentUser && (
                        <button
                            onClick={() => setShowReplyForm(v => !v)}
                            className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            Trả lời
                        </button>
                    )}
                    {currentUser?.id === comment.userId && (
                        <button
                            onClick={() => onDelete(comment.id)}
                            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <Trash2 size={11} /> Xóa
                        </button>
                    )}
                    {comment.replies?.length > 0 && (
                        <button
                            onClick={() => setShowReplies(v => !v)}
                            className="text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 cursor-pointer ml-auto"
                        >
                            {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {comment.replies.length} trả lời
                        </button>
                    )}
                </div>

                {/* Reply form */}
                {showReplyForm && (
                    <div className="mt-2 flex gap-2">
                        <input
                            type="text"
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReplySubmit()}
                            placeholder={`Trả lời ${comment.userDisplayName}...`}
                            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gray-400 bg-gray-50"
                            autoFocus
                        />
                        <button
                            onClick={handleReplySubmit}
                            disabled={submitting || !replyContent.trim()}
                            className="p-2 bg-gray-900 text-white rounded-full disabled:opacity-50 cursor-pointer hover:bg-black transition-colors"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                )}

                {/* Nested replies */}
                {showReplies && comment.replies?.length > 0 && (
                    <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-100">
                        {comment.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                productId={productId}
                                currentUser={currentUser}
                                onReplySubmit={onReplySubmit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ================================================================
// MAIN COMPONENT
// ================================================================
const ProductDetail = ({ product }) => {
    const { addToCart } = useCart();
    const { user } = useAuth();

    // --- Product state ---
    const [selections, setSelections] = useState({});
    const [currentSku, setCurrentSku] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isImageLoading, setIsImageLoading] = useState(false);

    // --- Reviews state (Read-only) ---
    const [reviews, setReviews] = useState([]);
    const [reviewPage, setReviewPage] = useState(0);
    const [reviewTotalPages, setReviewTotalPages] = useState(0);
    const [reviewLoading, setReviewLoading] = useState(false);

    // --- Comments state ---
    const [comments, setComments] = useState([]);
    const [commentPage, setCommentPage] = useState(0);
    const [commentTotalPages, setCommentTotalPages] = useState(0);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    // ----------------------------------------------------------------
    // Khởi tạo selection mặc định
    // ----------------------------------------------------------------
    useEffect(() => {
        if (product.options?.length > 0) {
            const defaults = {};
            product.options.forEach(opt => {
                const activeValues = opt.values?.filter(v => v.isActive !== false) || [];
                if (activeValues.length > 0) defaults[opt.name] = activeValues[0].value;
            });
            setSelections(defaults);
        }
    }, [product]);

    // ----------------------------------------------------------------
    // Tìm SKU khớp
    // ----------------------------------------------------------------
    useEffect(() => {
        if (!product.skus?.length) return;
        if (!product.options?.length) {
            setCurrentSku(product.skus.find(s => s.isActive !== false) || product.skus[0]);
            return;
        }
        if (Object.keys(selections).length < product.options.length) {
            setCurrentSku(null);
            return;
        }
        const sku = product.skus.find(s => {
            if (s.isActive === false) return false;
            const vals = s.optionValues?.map(ov => ov.value) || [];
            return Object.values(selections).every(v => vals.includes(v));
        });
        setCurrentSku(sku || null);
        setQuantity(1);
    }, [selections, product.skus, product.options]);

    // ----------------------------------------------------------------
    // Load Reviews (đã duyệt)
    // ----------------------------------------------------------------
    useEffect(() => {
        const load = async () => {
            setReviewLoading(true);
            try {
                const data = await getApprovedReviewsByProduct(product.id, reviewPage, 6);
                setReviews(data?.content || []);
                setReviewTotalPages(data?.totalPages || 0);
            } catch { setReviews([]); }
            finally { setReviewLoading(false); }
        };
        if (product?.id) load();
    }, [product?.id, reviewPage]);

    // ----------------------------------------------------------------
    // Load Comments
    // ----------------------------------------------------------------
    const loadComments = useCallback(async (page = 0) => {
        setCommentLoading(true);
        try {
            const data = await getCommentsByProduct(product.id, page, 15);
            setComments(data?.content || []);
            setCommentTotalPages(data?.totalPages || 0);
            setCommentPage(page);
        } catch { setComments([]); }
        finally { setCommentLoading(false); }
    }, [product?.id]);

    useEffect(() => { if (product?.id) loadComments(0); }, [product?.id, loadComments]);

    // ----------------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------------
    const checkOptionInStock = useCallback((optionName, value) => {
        if (!product.skus?.length) return false;

        const testSelections = { ...selections, [optionName]: value };

        return product.skus.some(sku => {
            if (sku.isActive === false || sku.stockQuantity <= 0) return false;

            const skuValues = sku.optionValues?.map(ov => ov.value) || [];

            return Object.values(testSelections).every(v => skuValues.includes(v));
        });
    }, [selections, product.skus]);

    const handleSelect = (optionName, value) => {
        setIsImageLoading(true);
        setSelections(prev => {
            const newState = { ...prev };
            if (newState[optionName] === value) {
                delete newState[optionName];
            } else {
                newState[optionName] = value;
            }
            return newState;
        });
        setTimeout(() => setIsImageLoading(false), 300);
    };

    const handleAddToCart = async () => {
        if (!currentSku) return toast.error("Vui lòng chọn đầy đủ phân loại!");
        if (currentSku.stockQuantity < quantity) return toast.error("Kho không đủ hàng!");

        try {
            await addToCart(product, currentSku, quantity);
            toast.success("Đã thêm vào giỏ hàng!");
        } catch (error) {
            console.error("Lỗi thêm giỏ hàng:", error);
        }
    };

    const handleCommentSubmit = async () => {
        if (!user) return toast.error("Vui lòng đăng nhập để bình luận");
        if (!commentInput.trim()) return;
        setCommentSubmitting(true);
        try {
            await postComment(product.id, { content: commentInput.trim() });
            setCommentInput('');
            toast.success("Đã đăng bình luận!");
            loadComments(0);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Không thể đăng bình luận");
        } finally { setCommentSubmitting(false); }
    };

    const handleReplySubmit = async (parentId, content) => {
        if (!user) return toast.error("Vui lòng đăng nhập để trả lời");
        try {
            await postComment(product.id, { content, parentId });
            loadComments(commentPage);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Không thể gửi trả lời");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
        try {
            await deleteComment(commentId);
            toast.success("Đã xóa bình luận");
            loadComments(commentPage);
        } catch { toast.error("Không thể xóa bình luận"); }
    };

    const averageRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const displayImage = currentSku?.imgUrl || product.thumbnail || 'https://placehold.co/600x800?text=No+Image';
    const isOutOfStock = !currentSku || currentSku.stockQuantity === 0;

    return (
        <div className="flex flex-col md:flex-row gap-12 font-sans mb-20 mt-20 animate-fade-in">

            {/* ========== CỘT TRÁI: ẢNH ========== */}
            <div className="md:w-1/2">
                <div className="sticky top-24">
                    <div className="relative overflow-hidden flex justify-center">
                        <img
                            src={displayImage}
                            alt={product.name}
                            className={`w-1/2 object-cover transition-all duration-500 ${isImageLoading ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100'}`}
                        />
                        {isOutOfStock && (
                            <div className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">
                                Sold Out
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== CỘT PHẢI: THÔNG TIN ========== */}
            <div className="md:w-1/2 flex flex-col pt-2">

                {/* Brand & Tên */}
                <div className="mb-6">
                    <p className="text-gray-500 text-sm font-semibold tracking-widest uppercase mb-2">
                        {product.brandName || 'Local Brand'}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(currentSku?.price || product.basePrice)}
                        </span>
                        {averageRating && (
                            <div className="flex items-center gap-1.5">
                                <StarDisplay rating={Math.round(averageRating)} size="sm" />
                                <span className="text-sm text-gray-500">({averageRating}/5 · {reviews.length} đánh giá)</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full h-px bg-gray-200 mb-8" />

                {/* Options */}
                <div className="space-y-6 mb-8">
                    {product.options?.map(opt => (
                        <div key={opt.id}>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">{opt.name}</label>
                                {opt.name.toLowerCase().includes('size') && (
                                    <button className="text-xs text-gray-500 hover:text-black flex items-center gap-1 underline">
                                        <Ruler size={14} /> Hướng dẫn chọn size
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {opt.values?.filter(v => v.isActive !== false).map(val => {
                                    const isSelected = selections[opt.name] === val.value;

                                    const hasStock = checkOptionInStock(opt.name, val.value);

                                    const isDisabled = !isSelected && !hasStock;

                                    return (
                                        <button
                                            key={val.id}
                                            disabled={isDisabled}
                                            onClick={() => handleSelect(opt.name, val.value)}
                                            className={`min-w-12 px-4 py-3 text-sm font-bold border transition-all
                    ${isSelected
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : isDisabled
                                                        ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60'
                                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900 cursor-pointer'
                                                }`}
                                        >
                                            {val.value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tồn kho */}
                <div className="mb-8">
                    {currentSku
                        ? <p className={`text-sm font-medium ${currentSku.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currentSku.stockQuantity > 0 ? `Còn ${currentSku.stockQuantity} sản phẩm` : 'Hết hàng'}
                        </p>
                        : <p className="text-sm text-amber-600 font-medium">Vui lòng chọn đầy đủ phân loại</p>
                    }
                </div>

                {/* Action */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                    <div className="flex items-center border border-gray-300 h-14 w-full sm:w-36 shrink-0">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex justify-center items-center text-gray-500 hover:text-black hover:bg-gray-50 transition">
                            <Minus size={18} />
                        </button>
                        <input type="number" className="w-full h-full text-center font-bold text-gray-900 outline-none bg-transparent" value={quantity} readOnly />
                        <button onClick={() => setQuantity(Math.min(currentSku?.stockQuantity || 1, quantity + 1))} disabled={isOutOfStock} className="w-12 h-full flex justify-center items-center text-gray-500 hover:text-black hover:bg-gray-50 transition disabled:opacity-50">
                            <Plus size={18} />
                        </button>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex-1 flex items-center justify-center gap-3 h-14 font-bold text-sm tracking-widest uppercase transition-all cursor-pointer
                            ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black active:scale-[0.98]'}`}
                    >
                        <ShoppingCart size={18} />
                        {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                    <button className="h-14 w-14 shrink-0 border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors cursor-pointer">
                        <Heart size={20} />
                    </button>
                </div>

                {/* Mô tả */}
                <div className="border-t border-gray-200 pt-8">
                    <h4 className="text-gray-900 font-bold uppercase tracking-wider mb-4 text-sm">Chi tiết sản phẩm</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{product.description || 'Chưa có mô tả.'}</p>
                </div>

                {/* ============================================================
                    KHU VỰC ĐÁNH GIÁ — CHỈ ĐỌC
                    Nút "Viết đánh giá" dẫn đến trang Lịch sử đơn hàng
                ============================================================ */}
                <div className="border-t border-gray-200 pt-8 mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-gray-900 font-bold uppercase tracking-wider text-sm">
                            Đánh giá sản phẩm
                        </h4>
                        {user
                            ? <a href="/profile?tab=orders" className="text-xs font-bold text-gray-700 border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-50 hover:border-gray-900 transition-colors">
                                ✍️ Viết đánh giá (từ đơn mua)
                            </a>
                            : <a href="/login" className="text-xs font-bold text-gray-500 underline">Đăng nhập để đánh giá</a>
                        }
                    </div>

                    {/* Summary bar */}
                    {averageRating && (
                        <div className="flex items-center gap-4 mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <div className="text-center">
                                <div className="text-4xl font-black text-amber-500">{averageRating}</div>
                                <StarDisplay rating={Math.round(averageRating)} />
                                <div className="text-xs text-gray-500 mt-1">{reviews.length} đánh giá</div>
                            </div>
                            <div className="flex-1 space-y-1">
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = reviews.filter(r => r.rating === star).length;
                                    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-2 text-xs">
                                            <span className="w-3 text-right text-gray-500">{star}</span>
                                            <span className="text-amber-400 text-xs">★</span>
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="w-5 text-gray-400">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Danh sách review */}
                    {reviewLoading
                        ? <p className="text-sm text-gray-400">Đang tải đánh giá...</p>
                        : reviews.length === 0
                            ? <p className="text-sm text-gray-400 py-4 text-center">Chưa có đánh giá cho sản phẩm này.</p>
                            : <div className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div>
                                                <span className="font-bold text-sm text-gray-900">{review.userDisplayName}</span>
                                                {review.skuName && (
                                                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{review.skuName}</span>
                                                )}
                                                <div className="mt-1"><StarDisplay rating={review.rating} size="sm" /></div>
                                            </div>
                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        {review.verifiedPurchase && (
                                            <span className="inline-block text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mb-2">
                                                ✓ Đã mua hàng
                                            </span>
                                        )}
                                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                    }

                    {/* Phân trang review */}
                    {reviewTotalPages > 1 && (
                        <div className="flex items-center gap-3 mt-5">
                            <button disabled={reviewPage === 0} onClick={() => setReviewPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50 cursor-pointer">← Trước</button>
                            <span className="text-sm text-gray-600">{reviewPage + 1}/{reviewTotalPages}</span>
                            <button disabled={reviewPage >= reviewTotalPages - 1} onClick={() => setReviewPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50 cursor-pointer">Sau →</button>
                        </div>
                    )}
                </div>

                {/* ============================================================
                    KHU VỰC BÌNH LUẬN & HỎI ĐÁP
                    Mọi user đăng nhập đều có thể bình luận
                ============================================================ */}
                <div className="border-t border-gray-200 pt-8 mt-8">
                    <h4 className="flex items-center gap-2 text-gray-900 font-bold uppercase tracking-wider text-sm mb-6">
                        <MessageCircle size={16} /> Bình luận & Hỏi đáp
                    </h4>

                    {/* Form bình luận mới */}
                    {user ? (
                        <div className="flex gap-3 mb-6">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=e5e7eb&color=374151&bold=true`}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
                            />
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={commentInput}
                                    onChange={e => setCommentInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleCommentSubmit()}
                                    placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến về sản phẩm..."
                                    className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-gray-50 hover:bg-white transition-colors"
                                />
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={commentSubmitting || !commentInput.trim()}
                                    className="p-2.5 bg-gray-900 text-white rounded-full hover:bg-black disabled:opacity-50 cursor-pointer transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                            <p className="text-sm text-gray-500">
                                <a href="/login" className="font-bold text-gray-900 underline">Đăng nhập</a> để đặt câu hỏi hoặc bình luận.
                            </p>
                        </div>
                    )}

                    {/* Danh sách comment */}
                    {commentLoading
                        ? <p className="text-sm text-gray-400">Đang tải bình luận...</p>
                        : comments.length === 0
                            ? <p className="text-sm text-gray-400 py-4 text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                            : <div className="space-y-5">
                                {comments.map(comment => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        productId={product.id}
                                        currentUser={user}
                                        onReplySubmit={handleReplySubmit}
                                        onDelete={handleDeleteComment}
                                    />
                                ))}
                            </div>
                    }

                    {/* Phân trang comment */}
                    {commentTotalPages > 1 && (
                        <div className="flex items-center gap-3 mt-6">
                            <button disabled={commentPage === 0} onClick={() => loadComments(commentPage - 1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50 cursor-pointer">← Trước</button>
                            <span className="text-sm text-gray-600">{commentPage + 1}/{commentTotalPages}</span>
                            <button disabled={commentPage >= commentTotalPages - 1} onClick={() => loadComments(commentPage + 1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-50 cursor-pointer">Sau →</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;