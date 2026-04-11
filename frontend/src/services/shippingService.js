import axios from '@/lib/axios'; // Đảm bảo import đúng instance axios của bạn

// Hàm tính phí ship từ Backend
export const calculateShippingFee = async (districtId, wardCode, weight = 1000) => {
    try {
        const response = await axios.get('/shipping/calculate', {
            params: {
                districtId,
                wardCode,
                weight
            }
        });
        return response.data; // Trả về số tiền (VD: 21001)
    } catch (error) {
        console.error("Lỗi tính phí ship:", error);
        return 0; // Nếu lỗi thì tạm tính là 0đ hoặc xử lý tùy ý
    }
};

// 1. Lấy danh sách Tỉnh
export const getProvinces = async () => {
    try {
        const response = await axios.get('/shipping/provinces');
        return response.data; // Trả về mảng [{ ProvinceID: 202, ProvinceName: "TP.HCM" }, ...]
    } catch (error) {
        console.error("Lỗi lấy tỉnh:", error);
        return [];
    }
};

// 2. Lấy danh sách Huyện (theo ProvinceID)
export const getDistricts = async (provinceId) => {
    try {
        const response = await axios.get('/shipping/districts', { params: { provinceId } });
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy huyện:", error);
        return [];
    }
};

// 3. Lấy danh sách Xã (theo DistrictID)
export const getWards = async (districtId) => {
    try {
        const response = await axios.get('/shipping/wards', { params: { districtId } });
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy xã:", error);
        return [];
    }
};

export const sendWebhook = async (payload) => {
    try {
        const response = await axios.get('/webhook', payload);
        return response.data;
    } catch (error) {
        console.error("Lỗi bắn webhook:", error);
        return [];
    }
}
