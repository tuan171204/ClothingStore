'use client';

import React, { useEffect, useState } from 'react';
import { getBrands } from '@/services/brandService';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await getBrands();
            setBrands(data);
            setLoading(false);
        };
        fetch();
    }, []);

    if (loading) return <div className="p-8 text-center">Đang tải thương hiệu...</div>;

    return (
        <div className="p-2 max-w mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Tag size={24} className="text-purple-600" /> Quản lý Thương hiệu
                </h1>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700">
                    <Plus size={18} /> Thêm thương hiệu
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full border-collapse font-sans text-center">
                    <thead className="bg-gray-50 text-gray-600 border-b text-md uppercase">
                        <tr>
                            <th className="p-4 border-b">ID</th>
                            <th className="p-4 border-b">Logo</th>
                            <th className="p-4 border-b">Tên thương hiệu</th>
                            <th className="p-4 border-b">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {brands.length > 0 ? brands.map((brand) => (
                            <tr key={brand.id} className="hover:bg-gray-50">
                                <td className="p-4 text-gray-500">#{brand.id}</td>
                                <td className="p-4 flex justify-center">
                                    <div className="w-20 h-20 rounded-full border bg-gray-50 overflow-hidden flex items-center justify-center">
                                        {brand.logo ? (
                                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400">N/A</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-gray-800">
                                    <input type="text"
                                        readOnly
                                        className='text-center bg-gray-700 text-white px-3 py-1.5 rounded-md'
                                        value={brand.name} />
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button className="text-black bg-amber-400 hover:bg-amber-600 cursor-pointer p-4 rounded-lg transition-colors"><Edit size={18} /></button>
                                        <button className="text-white bg-red-600 hover:bg-red-800 cursor-pointer p-4 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">Chưa có thương hiệu nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}