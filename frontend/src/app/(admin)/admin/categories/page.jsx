'use client';

import React, { useEffect, useState } from 'react';
import { getCategories } from '@/services/categoryService'; // Dùng Service vừa tạo
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await getCategories();
            setCategories(data);
            setLoading(false);
        };
        fetch();
    }, []);

    if (loading) return <div className="p-8 text-center">Đang tải danh mục...</div>;

    return (
        <div className="p-2 max-w mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FolderTree size={24} className="text-blue-600" /> Quản lý Danh mục
                </h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={18} /> Thêm danh mục
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full border-collapse font-sans text-center">
                    <thead className="bg-gray-50 text-gray-600 border-b text-md uppercase">
                        <tr>
                            <th className="p-4 border-b">ID</th>
                            <th className="p-4 border-b">Tên danh mục</th>
                            <th className="p-4 border-b">Danh mục cha</th>
                            <th className="p-4 border-b">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {categories.length > 0 ? categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="p-4 text-gray-500">#{cat.id}</td>
                                <td className="p-4 font-medium text-gray-800">{cat.name}</td>
                                <td className="p-4 text-gray-500">
                                    {cat.parentId ? <span className="text-md font-bold bg-amber-300 text-black px-5 py-2 rounded">#{cat.parentId}</span>
                                        : <span className="text-md font-bold bg-green-200 text-green-900 px-3 py-2 rounded">Gốc</span>}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="text-black bg-amber-400 hover:bg-amber-600 cursor-pointer p-4 rounded-lg transition-colors"><Edit size={18} /></button>
                                        <button className="text-white bg-red-600 hover:bg-red-800 cursor-pointer p-4 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">Chưa có danh mục nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}