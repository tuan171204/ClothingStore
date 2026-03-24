import axios from '@/lib/axios';

const API_PREFIX = '';

export const getApprovedReviewsByProduct = async (productId, page = 0, size = 10) => {
    const response = await axios.get(`${API_PREFIX}/products/${productId}/reviews`, {
        params: { page, size },
    });

    return response.data?.result;
};

export const createReview = async (productId, payload) => {
    const response = await axios.post(`${API_PREFIX}/products/${productId}/reviews`, payload);
    return response.data?.result;
};

export const updateReview = async (reviewId, payload) => {
    const response = await axios.put(`${API_PREFIX}/reviews/${reviewId}`, payload);
    return response.data?.result;
};

export const getMyReviewsByProducts = async (productIds = []) => {
    if (!Array.isArray(productIds) || productIds.length === 0) {
        return [];
    }

    const response = await axios.get(`${API_PREFIX}/reviews/me`, {
        params: { productIds },
        paramsSerializer: {
            indexes: null,
        },
    });

    return response.data?.result || [];
};

export const getPendingReviews = async (page = 0, size = 20) => {
    const response = await axios.get(`${API_PREFIX}/admin/reviews/pending`, {
        params: { page, size },
    });
    return response.data?.result;
};

export const approveReview = async (reviewId) => {
    const response = await axios.put(`${API_PREFIX}/admin/reviews/${reviewId}/approve`);
    return response.data?.result;
};

export const rejectReview = async (reviewId) => {
    const response = await axios.put(`${API_PREFIX}/admin/reviews/${reviewId}/reject`);
    return response.data?.result;
};
