    import axios from '@/lib/axios';

    /**
     * Lấy danh sách comment (kèm replies) của 1 sản phẩm
     */
    export const getCommentsByProduct = async (productId, page = 0, size = 15) => {
        const response = await axios.get(`/products/${productId}/comments`, {
            params: { page, size },
        });
        return response.data?.result; // Page<CommentResponse>
    };

    /**
     * Đăng comment mới (hoặc reply)
     * payload: { content, parentId? }
     */
    export const postComment = async (productId, payload) => {
        const response = await axios.post(`/products/${productId}/comments`, payload);
        return response.data?.result;
    };

    /**
     * Xóa comment (chỉ chủ comment)
     */
    export const deleteComment = async (commentId) => {
        const response = await axios.delete(`/comments/${commentId}`);
        return response.data?.result;
    };