'use client';

import React from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { LogOut } from 'lucide-react';

export default function AdminHeader() {
    // Lấy thông tin user và hàm logout từ Context
    const { adminUser, logout } = useAdminAuth();

    return (
        <header className="bg-white shadow h-16 flex items-center justify-between px-6 z-10">
            <h2 className="font-semibold text-gray-700">
                Xin chào, <span className="text-blue-600">{adminUser?.fullName || 'Admin'}</span>!
            </h2>

            <button
                onClick={logout}
                className="cursor-pointer flex items-center gap-2 bg-red-600 hover:bg-red-900 text-white px-4 py-2 rounded-lg transition-colors font-bold border border-transparent hover:border-red-200"
            >
                <LogOut size={22} />
                Đăng xuất
            </button>
        </header>
    );
}