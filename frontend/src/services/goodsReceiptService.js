import axios from '@/lib/axios';

/** Paginated + filtered list */
export const getAllGoodsReceipts = async ({
    status = '',
    fromDate = '',
    toDate = '',
    page = 0,
    size = 10
} = {}) => {
    try {
        const params = { page, size };
        if (status) params.status = status;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        const response = await axios.get('/goods-receipts', { params });
        return response.data;
    } catch (error) {
        console.error('Lỗi lấy danh sách phiếu nhập kho:', error);
        return { result: { content: [], page: 0, size, totalElements: 0, totalPages: 0 } };
    }
};

export const getGoodsReceiptById = async (id) => {
    try {
        const response = await axios.get(`/goods-receipts/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi lấy chi tiết phiếu nhập ${id}:`, error);
        return null;
    }
};

export const createGoodsReceipt = async (receiptData) => {
    const response = await axios.post('/goods-receipts', receiptData);
    return response.data;
};

export const updateGoodsReceipt = async (id, receiptData) => {
    const response = await axios.put(`/goods-receipts/${id}`, receiptData);
    return response.data;
};

export const confirmGoodsReceipt = async (id) => {
    const response = await axios.post(`/goods-receipts/${id}/confirm`);
    return response.data;
};