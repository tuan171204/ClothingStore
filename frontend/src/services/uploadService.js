import axios from '@/lib/axios';

// Hàm upload trả về String (URL ảnh)
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post('/products/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Trả về link ảnh: https://res.cloudinary...
    } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        throw error;
    }
};