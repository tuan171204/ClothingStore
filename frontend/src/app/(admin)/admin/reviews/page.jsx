"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { approveReview, getPendingReviews, rejectReview } from '@/services/reviewService';

const AdminReviewPage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [workingId, setWorkingId] = useState(null);

    const fetchPendingReviews = async () => {
        try {
            setLoading(true);
            const pageData = await getPendingReviews(0, 50);
            setReviews(pageData?.content || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không tải được danh sách review chờ duyệt');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingReviews();
    }, []);

    const handleApprove = async (reviewId) => {
        try {
            setWorkingId(reviewId);
            await approveReview(reviewId);
            toast.success('Đã duyệt đánh giá');
            await fetchPendingReviews();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể duyệt đánh giá');
        } finally {
            setWorkingId(null);
        }
    };

    const handleReject = async (reviewId) => {
        try {
            setWorkingId(reviewId);
            await rejectReview(reviewId);
            toast.success('Đã từ chối đánh giá');
            await fetchPendingReviews();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Không thể từ chối đánh giá');
        } finally {
            setWorkingId(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Duyệt đánh giá sản phẩm</h1>
                <button
                    onClick={fetchPendingReviews}
                    className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                    Làm mới
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Đang tải dữ liệu...</p>
            ) : reviews.length === 0 ? (
                <p className="text-gray-500">Không có đánh giá nào đang chờ duyệt.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                                <th className="py-3 pr-4">Review ID</th>
                                <th className="py-3 pr-4">Sản phẩm</th>
                                <th className="py-3 pr-4">User</th>
                                <th className="py-3 pr-4">Số sao</th>
                                <th className="py-3 pr-4">Nội dung</th>
                                <th className="py-3 pr-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map((review) => (
                                <tr key={review.id} className="border-b border-gray-100 align-top">
                                    <td className="py-4 pr-4 font-medium text-gray-900">#{review.id}</td>
                                    <td className="py-4 pr-4 text-gray-700">{review.productId}</td>
                                    <td className="py-4 pr-4 text-gray-700">{review.userId}</td>
                                    <td className="py-4 pr-4 text-amber-500 font-semibold">{'★'.repeat(review.rating)}</td>
                                    <td className="py-4 pr-4 text-gray-700 max-w-xl">{review.comment}</td>
                                    <td className="py-4 pr-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                disabled={workingId === review.id}
                                                onClick={() => handleApprove(review.id)}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                                            >
                                                Duyệt
                                            </button>
                                            <button
                                                disabled={workingId === review.id}
                                                onClick={() => handleReject(review.id)}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
                                            >
                                                Từ chối
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminReviewPage;
