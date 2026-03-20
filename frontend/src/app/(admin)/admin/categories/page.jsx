'use client';

import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { Plus, Edit, Trash2, FolderTree, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', parentId: '' });

    const fetchCategories = async () => {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Xử lý mở Modal
    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, parentId: category.parentId || '' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', parentId: '' });
        }
        setIsModalOpen(true);
    };

    // Xử lý Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Convert chuỗi rỗng thành null cho parentId
        const payload = {
            name: formData.name,
            parentId: formData.parentId ? parseInt(formData.parentId) : null
        };

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, payload);
                toast.success('Cập nhật danh mục thành công!');
            } else {
                await createCategory(payload);
                toast.success('Thêm danh mục thành công!');
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    // Xử lý Xóa
    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            try {
                await deleteCategory(id);
                toast.success('Xóa danh mục thành công!');
                fetchCategories();
            } catch (error) {
                toast.error('Lỗi khi xóa danh mục! Có thể danh mục này đang chứa sản phẩm.');
            }
        }
    };

    if (loading && categories.length === 0) return <div className="p-8 text-center">Đang tải danh mục...</div>;

    return (
        <div className="p-2 max-w mx-auto relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FolderTree size={24} className="text-blue-600" /> Quản lý Danh mục
                </h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer">
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
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => openModal(cat)} className="text-black bg-amber-400 hover:bg-amber-600 cursor-pointer p-4 rounded-lg transition-colors"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(cat.id)} className="text-white bg-red-600 hover:bg-red-800 cursor-pointer p-4 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">Chưa có danh mục nào</td></tr>
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
                                {editingCategory ? 'Cập nhật Danh mục' : 'Thêm Danh mục mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">Tên danh mục <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Áo thun nam..."
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-2">Danh mục cha</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                >
                                    <option value="">-- Trống (Tạo danh mục gốc) --</option>
                                    {categories
                                        .filter(c => c.id !== editingCategory?.id) // Lọc bỏ chính nó để chống loop
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Hủy</button>
                                <button type="submit" className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}