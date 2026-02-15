'use client';

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadImage } from '@/services/uploadService'; // Import service vừa tạo
import { toast } from 'react-toastify';

export default function ImageUpload({ onUpload, currentImage }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage || '');

    // Hàm xử lý khi chọn file
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Kiểm tra file (tùy chọn)
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh!');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error('File ảnh quá lớn (Max 5MB)!');
            return;
        }

        // 2. Upload
        try {
            setUploading(true);

            // Gọi Service upload
            const url = await uploadImage(file);

            // 3. Cập nhật state và báo ra ngoài cho form cha
            setPreview(url);
            onUpload(url); // Gọi callback để form cha nhận được URL
            toast.success('Upload ảnh thành công!');
        } catch (error) {
            toast.error('Lỗi khi upload ảnh. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview('');
        onUpload('');
        // Reset input file (nếu cần thiết có thể dùng useRef)
    };

    return (
        <div className="w-full">
            {preview ? (
                // --- TRẠNG THÁI ĐÃ CÓ ẢNH ---
                <div className="relative w-full aspect-square md:aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                    />

                    {/* Overlay nút xóa */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer bg-white text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100 flex items-center gap-2">
                            <Upload size={16} /> Thay ảnh
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                        </label>
                        <button
                            onClick={handleRemove}
                            type="button"
                            className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-600 flex items-center gap-2 cursor-pointer"
                        >
                            <X size={16} /> Xóa
                        </button>
                    </div>
                </div>
            ) : (
                // --- TRẠNG THÁI CHƯA CÓ ẢNH ---
                <label className={`flex flex-col items-center justify-center w-full aspect-square md:aspect-video rounded-lg border-2 border-dashed border-gray-300 cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                        {uploading ? (
                            <>
                                <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
                                <p className="text-sm">Đang upload...</p>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                    <Upload size={24} className="text-gray-400" />
                                </div>
                                <p className="mb-2 text-sm font-medium text-gray-700">Click để tải ảnh lên</p>
                                <p className="text-xs text-gray-500">PNG, JPG, WEBP (Max 5MB)</p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                        disabled={uploading}
                    />
                </label>
            )}
        </div>
    );
}