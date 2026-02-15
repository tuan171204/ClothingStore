import axios from '@/lib/axios';

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Gọi API Backend: http://localhost:8080/api/v1/products/upload-image
        // Backend trả về chuỗi URL ảnh trực tiếp (String)
        const response = await axios.post('/products/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Trả về URL ảnh (VD: https://res.cloudinary...)
    } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        throw error;
    }
};