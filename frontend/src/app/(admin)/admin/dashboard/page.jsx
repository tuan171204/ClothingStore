import React from 'react';

export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Tổng quan hệ thống</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                    <p className="text-gray-500">Doanh thu ngày</p>
                    <p className="text-2xl font-bold">15,000,000 ₫</p>
                </div>
                {/* Thêm các card khác nếu muốn */}
            </div>
        </div>
    );
}