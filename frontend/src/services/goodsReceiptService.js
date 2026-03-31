import axios from '@/lib/axios';

export const getAllGoodsReceipts = async () => {
    try {
        const response = await axios.get('/goods-receipts');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách phiếu nhập kho:", error);
        return { result: [] };
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
    try {
        const response = await axios.post('/goods-receipts', receiptData);
        return response.data;
    } catch (error) {
        console.error("Lỗi tạo phiếu nhập kho:", error);
        throw error;
    }
};

export const updateGoodsReceipt = async (id, receiptData) => {
    try {
        const response = await axios.put(`/goods-receipts/${id}`, receiptData);
        return response.data;
    } catch (error) {
        console.error("Lỗi cập nhật phiếu nhập kho:", error);
        throw error;
    }
};

export const confirmGoodsReceipt = async (id) => {
    try {
        const response = await axios.post(`/goods-receipts/${id}/confirm`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi xác nhận phiếu nhập ${id}:`, error);
        throw error;
    }
};