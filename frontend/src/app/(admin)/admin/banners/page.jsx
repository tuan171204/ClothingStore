// src/app/(admin)/admin/banners/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { bannerService } from '@/services/bannerService';
import { toast } from 'react-toastify';
import { Plus, Trash2, Power, X } from 'lucide-react';

export default function BannersPage() {
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        linkUrl: '',
        displayOrder: 1,
        file: null
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setIsLoading(true);
            const response = await bannerService.getAllBanners();
            // Điều chỉnh tùy thuộc vào cấu trúc trả về thực tế (response.data hoặc response.data.data)
            setBanners(response.data || []);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách banner');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await bannerService.toggleBannerStatus(id);
            toast.success('Cập nhật trạng thái thành công');
            fetchBanners();
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
        try {
            await bannerService.deleteBanner(id);
            toast.success('Xóa banner thành công');
            fetchBanners();
        } catch (error) {
            toast.error('Lỗi khi xóa banner');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) {
            toast.warning('Vui lòng chọn ảnh banner');
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (formData.file.size > MAX_FILE_SIZE) {
            toast.warning('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB!');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('linkUrl', formData.linkUrl);
        data.append('displayOrder', formData.displayOrder);
        data.append('file', formData.file);

        try {
            setIsSubmitting(true);
            await bannerService.createBanner(data);
            toast.success('Thêm banner thành công');
            setIsModalOpen(false);
            setFormData({ title: '', linkUrl: '', displayOrder: 1, file: null });
            fetchBanners();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi thêm banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Banners</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Thêm Banner</span>
                </button>
            </div>

            {/* Danh sách Banners */}
            {isLoading ? (
                <div className="text-center py-10">Đang tải...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="aspect-[21/9] relative bg-gray-100">
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className={`w-full h-full object-cover transition-opacity ${!banner.active && 'opacity-50 grayscale'}`}
                                />
                                {!banner.active && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <span className="text-white font-medium bg-red-500 px-3 py-1 rounded-full text-sm">Đã ẩn</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-gray-800 mb-1">{banner.title}</h3>
                                <p className="text-sm text-gray-500 mb-2 truncate">Link: {banner.linkUrl}</p>
                                <p className="text-sm font-medium text-blue-600 mb-4">Thứ tự hiển thị: {banner.displayOrder}</p>

                                <div className="flex justify-end gap-2 border-t pt-4">
                                    <button
                                        onClick={() => handleToggle(banner.id)}
                                        className={`p-2 rounded-lg transition-colors ${banner.active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                        title={banner.active ? "Ẩn banner" : "Hiện banner"}
                                    >
                                        <Power size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        title="Xóa banner"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {banners.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            Chưa có banner nào. Hãy thêm mới!
                        </div>
                    )}
                </div>
            )}

            {/* Modal Thêm Mới */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Thêm Banner Mới</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn (Link URL)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="/products/ao-thun"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.displayOrder}
                                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File ảnh (Khuyên dùng tỉ lệ 21:9)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Đang tải lên...' : 'Lưu Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}