"use client"; // Vì có tương tác (click, change) nên phải là Client Component

import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react'; // Icon từ thư viện lucide-react
import { uploadImage } from '@/services/uploadService';

const ImageUpload = ({ value, onChange }) => {
    // value: URL ảnh hiện tại (nếu đang sửa sản phẩm)
    // onChange: Hàm callback để báo cho form cha biết URL mới

    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(value);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Hiện preview ngay lập tức cho mượt
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setLoading(true);

        try {
            // 2. Gọi API upload lên Server -> Cloudinary
            const url = await uploadImage(file);

            // 3. Báo cho component cha biết URL xịn
            onChange(url);
        } catch (error) {
            alert("Upload thất bại, vui lòng thử lại!");
            setPreview(null); // Reset nếu lỗi
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        setPreview(null);
        onChange(""); // Xóa URL
    };

    return (
        <div className="w-full">
            {preview ? (
                // --- TRẠNG THÁI: ĐÃ CÓ ẢNH ---
                <div className="relative w-40 h-40 border rounded-lg overflow-hidden group">
                    <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />

                    {/* Nút xóa ảnh */}
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={16} />
                    </button>

                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                            <Loader2 className="animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                // --- TRẠNG THÁI: CHƯA CÓ ẢNH (Nút Upload) ---
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {loading ? (
                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        )}
                        <p className="text-xs text-gray-500">Click để tải ảnh</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </label>
            )}
        </div>
    );
};

export default ImageUpload;