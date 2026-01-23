// src/app/(shop)/page.jsx
import React from 'react';

export default function HomePage() {
    return (
        <div className="p-10 bg-blue-50 h-screen">
            <h1 className="text-3xl font-bold text-blue-600">Đây là trang dành cho KHÁCH HÀNG 🛒</h1>
            <p>Danh sách sản phẩm sẽ hiện ở đây...</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Mua ngay</button>
        </div>
    );
}