import axios from '@/lib/axios';

/*
* API LẤY DANH SÁCH TẤT CẢ PHIẾU NHẬP
*/
export const getAllGoodsReceipts = async () => {
    try {
        const response = await axios.get('/goods-receipts');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách phiếu nhập kho:", error);
        return { result: [] }; 
    }
};

/*
* API LẤY CHI TIẾT 1 PHIẾU NHẬP
*/
export const getGoodsReceiptById = async (id) => {
    try {
        const response = await axios.get(`/goods-receipts/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi lấy chi tiết phiếu nhập ${id}:`, error);
        return null;
    }
};

/*
* API TẠO PHIẾU NHẬP KHO MỚI (CHỜ DUYỆT)
*/
export const createGoodsReceipt = async (receiptData) => {
    try {
        const response = await axios.post('/goods-receipts', receiptData);
        return response.data;
    } catch (error) {
        console.error("Lỗi tạo phiếu nhập kho:", error);
        throw error; // Ném lỗi ra để hiển thị toast bên ngoài component
    }
};

/*
* API XÁC NHẬN DUYỆT PHIẾU NHẬP (ADMIN)
*/
export const confirmGoodsReceipt = async (id) => {
    try {
        const response = await axios.post(`/goods-receipts/${id}/confirm`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi xác nhận phiếu nhập ${id}:`, error);
        throw error;
    }
};