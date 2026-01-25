"use client";

import React, { useState } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function CreateProductPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        thumbnail: '', // Lưu URL ảnh Cloudinary vào đây
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Gọi API tạo sản phẩm (Bạn cần viết API này ở Backend sau)
            // Tạm thời log ra console để kiểm tra
            console.log("Dữ liệu gửi đi:", formData);
            alert("Đã lấy được URL ảnh: " + formData.thumbnail);

            // await axios.post('/products', formData);
            // router.push('/admin/products');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6">Thêm sản phẩm mới</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Tên sản phẩm */}
                <div>
                    <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                    <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* 2. Upload Ảnh (Dùng component xịn vừa viết) */}
                <div>
                    <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
                    <ImageUpload
                        value={formData.thumbnail}
                        onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                    />
                </div>

                {/* 3. Nút Submit */}
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Tạo sản phẩm
                </button>
            </form>
        </div>
    );
}