'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { uploadImage } from '@/services/uploadService';
import { toast } from 'react-toastify';

export default function ImageUpload({ onUpload, currentImage, uploadFunc = uploadImage }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage || '');

    // Đồng bộ props xuống state mỗi khi component cha thay đổi dữ liệu
    useEffect(() => {
        setPreview(currentImage || '');
    }, [currentImage]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh!');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // Max 5MB
            toast.error('File ảnh quá lớn (Max 5MB)!');
            return;
        }

        try {
            setUploading(true);
            const url = await uploadFunc(file);

            setPreview(url); // Hiện ảnh lập tức
            onUpload(url);   // Bắn URL về cho form cha (EditProductPage)
        } catch (error) {
            toast.error('Upload thất bại!');
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset thẻ input để có thể chọn lại cùng 1 ảnh
        }
    };

    const handleRemove = (e) => {
        e.preventDefault();
        setPreview('');
        onUpload('');
    };

    return (
        <div className={`relative w-full h-full min-h-[64px] rounded-md border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden group hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>

            {/* TRẠNG THÁI 1: ĐÃ CÓ ẢNH */}
            {preview ? (
                <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />

                    {/* Nút X màu đỏ góc phải trên, chỉ hiện khi hover chuột vào ảnh */}
                    <button
                        onClick={handleRemove}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow cursor-pointer hover:bg-red-600"
                        title="Xóa ảnh"
                    >
                        <X size={12} />
                    </button>
                </>
            ) : (

                /* TRẠNG THÁI 2: CHƯA CÓ ẢNH (Hiển thị icon Upload) */
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2">
                    {uploading ? (
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                    ) : (
                        <Upload size={24} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    )}

                    {/* Thẻ input ẩn */}
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