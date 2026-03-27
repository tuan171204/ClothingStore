import axios from '@/lib/axios';

/*
* API LẤY TỒN KHO CỦA 1 SKU CỤ THỂ
*/
export const getInventoryBySkuId = async (skuId) => {
    try {
        const response = await axios.get(`/inventory/sku/${skuId}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi lấy tồn kho của SKU ${skuId}:`, error);
        return null;
    }
};

/*
* API LẤY DANH SÁCH SKU SẮP HẾT HÀNG (CẢNH BÁO LOW STOCK)
*/
export const getLowStockItems = async () => {
    try {
        const response = await axios.get('/inventory/low-stock');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách cảnh báo tồn kho:", error);
        return { result: [] };
    }
};

/*
* API CẬP NHẬT NGƯỠNG CẢNH BÁO TỒN KHO THẤP
*/
export const updateLowStockThreshold = async (skuId, thresholdData) => {
    try {
        // thresholdData có định dạng: { threshold: 10 }
        const response = await axios.put(`/inventory/sku/${skuId}/threshold`, thresholdData);
        return response.data;
    } catch (error) {
        console.error("Lỗi cập nhật ngưỡng cảnh báo:", error);
        throw error;
    }
};

/*
* API ĐIỀU CHỈNH TỒN KHO THỦ CÔNG
*/
export const adjustStock = async (adjustData) => {
    try {
        // adjustData có định dạng: { skuId, quantityChange, reason }
        const response = await axios.post('/inventory/adjust', adjustData);
        return response.data;
    } catch (error) {
        console.error("Lỗi điều chỉnh tồn kho:", error);
        throw error;
    }
};

/*
* API LẤY LỊCH SỬ BIẾN ĐỘNG KHO CỦA 1 SKU
*/
export const getStockMovements = async (skuId) => {
    try {
        const response = await axios.get(`/inventory/sku/${skuId}/movements`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi lấy biến động kho của SKU ${skuId}:`, error);
        return { result: [] };
    }
};

/*
* API LẤY BÁO CÁO TỒN KHO HIỆN TẠI (TỔNG HỢP)
*/
export const getStockOnHand = async () => {
    try {
        const response = await axios.get('/inventory/report/stock-on-hand');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy báo cáo tồn kho hiện tại:", error);
        return null;
    }
};

/*
* API LẤY BÁO CÁO ĐỊNH GIÁ KHO
*/
export const getInventoryValuation = async () => {
    try {
        const response = await axios.get('/inventory/report/valuation');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy báo cáo định giá kho:", error);
        return null;
    }
};