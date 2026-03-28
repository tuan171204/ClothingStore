import axios from '@/lib/axios';

// ================================================================
// Trang Chi tiết sản phẩm (Read-only)
// ================================================================

export const getApprovedReviewsByProduct = async (productId, page = 0, size = 10) => {
    const response = await axios.get(`/products/${productId}/reviews`, {
        params: { page, size },
    });
    return response.data?.result;
};

// ================================================================
// Trang Lịch sử đơn hàng
// ================================================================

/**
 * Lấy trạng thái review của từng item trong 1 đơn hàng.
 * Trả về mảng OrderItemReviewStatus
 */
export const getReviewStatusByOrder = async (orderId) => {
    const response = await axios.get(`/orders/${orderId}/review-status`);
    return response.data?.result || [];
};

/**
 * Tạo hoặc cập nhật review từ trang Order History
 * payload: { orderId, skuId, productId, rating, comment }
 */
export const submitReviewFromOrder = async (payload) => {
    const response = await axios.post(`/reviews`, payload);
    return response.data?.result;
};

// ================================================================
// Admin
// ================================================================

export const getPendingReviews = async (page = 0, size = 20) => {
    const response = await axios.get(`/admin/reviews/pending`, {
        params: { page, size },
    });
    return response.data?.result;
};

export const approveReview = async (reviewId) => {
    const response = await axios.put(`/admin/reviews/${reviewId}/approve`);
    return response.data?.result;
};

export const rejectReview = async (reviewId) => {
    const response = await axios.put(`/admin/reviews/${reviewId}/reject`);
    return response.data?.result;
};

export const bulkApprove = async (ids) => {
    const response = await axios.post(`/admin/reviews/bulk-approve`, ids);
    return response.data?.result;
};

export const bulkReject = async (ids) => {
    const response = await axios.post(`/admin/reviews/bulk-reject`, ids);
    return response.data?.result;
};

export const getPendingWithFilter = async (params) => {
    const response = await axios.get(`/admin/reviews/pending`, { params });
    return response.data?.result;
};