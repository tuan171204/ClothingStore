'use client';

import React, { useEffect, useState } from 'react';
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/services/brandService';
import { Plus, Edit, Trash2, Tag, X } from 'lucide-react';
import { toast } from 'react-toastify';
import ImageUpload from '@/components/admin/ImageUpload';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({ name: '', logo: '' });

    const fetchBrands = async () => {
        setLoading(true);
        const data = await getBrands();
        setBrands(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    // Xử lý mở Modal
    const openModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData({ name: brand.name, logo: brand.logo || '' });
        } else {
            setEditingBrand(null);
            setFormData({ name: '', logo: '' });
        }
        setIsModalOpen(true);
    };

    // Xử lý Submit (Create / Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await updateBrand(editingBrand.id, formData);
                toast.success('Cập nhật thương hiệu thành công!');
            } else {
                await createBrand(formData);
                toast.success('Thêm thương hiệu thành công!');
            }
            setIsModalOpen(false);
            fetchBrands(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    // Xử lý Xóa
    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
            try {
                await deleteBrand(id);
                toast.success('Xóa thương hiệu thành công!');
                fetchBrands();
            } catch (error) {
                toast.error('Lỗi khi xóa thương hiệu!');
            }
        }
    };

    const handleImageUpload = (url) => {
        setFormData({ ...formData, logo: url });
    };

    if (loading && brands.length === 0) return <div className="p-8 text-center">Đang tải thương hiệu...</div>;

    return (
        <div className="p-2 max-w mx-auto relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Tag size={24} className="text-purple-600" /> Quản lý Thương hiệu
                </h1>
                <button
                    onClick={() => openModal()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors cursor-pointer">
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
                                        className='text-center bg-gray-700 text-white px-3 py-1.5 rounded-md focus:outline-none'
                                        value={brand.name} />
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => openModal(brand)} className="text-black bg-amber-400 hover:bg-amber-600 cursor-pointer p-4 rounded-lg transition-colors"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(brand.id)} className="text-white bg-red-600 hover:bg-red-800 cursor-pointer p-4 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">Chưa có thương hiệu nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingBrand ? 'Cập nhật Thương hiệu' : 'Thêm Thương hiệu mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">Tên thương hiệu <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nhập tên thương hiệu..."
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-2">Đường dẫn Logo (URL)</label>
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-medium mb-2">Logo thương hiệu</label>
                                    <ImageUpload
                                        value={formData.logo}
                                        onUpload={handleImageUpload}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Hủy</button>
                                <button type="submit" className="px-5 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors cursor-pointer">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}