import axiosInstance from '@/lib/axios';

export const bannerService = {
    getAllBanners: () => axiosInstance.get('/banners'),

    createBanner: (formData) => axiosInstance.post('/banners/admin', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),

    toggleBannerStatus: (id) => axiosInstance.patch(`/banners/admin/${id}/toggle`),

    deleteBanner: (id) => axiosInstance.delete(`/banners/admin/${id}`)
};