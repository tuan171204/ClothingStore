'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { Plus, Edit, Trash2, FolderTree, X, Search, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'react-toastify';

const LEVEL_COLORS = [
    'bg-green-100 text-green-800 border border-green-200',
    'bg-blue-100 text-blue-800 border border-blue-200',
    'bg-purple-100 text-purple-800 border border-purple-200',
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [levelFilter, setLevelFilter] = useState('all'); // 'all' | 'root' | 'child'

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', parentId: '' });
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    // Build map để tra parentName
    const categoryMap = useMemo(() => {
        const map = {};
        categories.forEach(c => { map[c.id] = c; });
        return map;
    }, [categories]);

    // Filter phía frontend
    const filtered = useMemo(() => {
        let result = [...categories];
        if (levelFilter === 'root') result = result.filter(c => !c.parentId);
        if (levelFilter === 'child') result = result.filter(c => !!c.parentId);
        if (keyword.trim()) {
            const kw = keyword.trim().toLowerCase();
            result = result.filter(c => c.name.toLowerCase().includes(kw));
        }
        return result;
    }, [categories, keyword, levelFilter]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            parentId: formData.parentId ? parseInt(formData.parentId) : null,
        };
        setSaving(true);
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
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa danh mục này? (Các danh mục con sẽ mất liên kết cha)')) return;
        try {
            await deleteCategory(id);
            toast.success('Xóa danh mục thành công!');
            fetchCategories();
        } catch {
            toast.error('Lỗi khi xóa! Có thể danh mục đang có sản phẩm.');
        }
    };

    const rootCount = categories.filter(c => !c.parentId).length;
    const childCount = categories.filter(c => !!c.parentId).length;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FolderTree size={22} className="text-blue-600" />
                        Quản lý Danh mục
                    </h1>
                    <p className="text-md text-gray-500 mt-0.5">
                        {rootCount} gốc · {childCount} con · {filtered.length} hiển thị
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-md">
                    <Plus size={17} /> Thêm danh mục
                </button>
            </div>

            {/* ── TOOLBAR ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên danh mục..."
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        {keyword && (
                            <button onClick={() => setKeyword('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button onClick={fetchCategories}
                        className="flex items-center gap-2 px-4 py-2.5 text-md border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white text-gray-600 cursor-pointer font-medium">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>

                {/* Level filter pills */}
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 mr-1">Cấp:</span>
                    {[
                        { value: 'all', label: 'Tất cả', count: categories.length },
                        { value: 'root', label: '🌳 Gốc', count: rootCount },
                        { value: 'child', label: '📁 Con', count: childCount },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setLevelFilter(opt.value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer border ${levelFilter === opt.value
                                    ? 'bg-blue-600 text-white border-transparent shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                                }`}>
                            {opt.label}
                            <span className={`ml-1 ${levelFilter === opt.value ? 'text-blue-200' : 'text-gray-400'}`}>
                                ({opt.count})
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <RefreshCw size={28} className="animate-spin text-blue-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <FolderTree size={40} className="mx-auto mb-3 text-gray-200" />
                        <p>{keyword ? `Không tìm thấy danh mục "${keyword}"` : 'Chưa có danh mục nào'}</p>
                    </div>
                ) : (
                    <table className="w-full text-md">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-5 py-3 text-left w-16">ID</th>
                                <th className="px-5 py-3 text-left">Tên danh mục</th>
                                <th className="px-5 py-3 text-left">Danh mục cha</th>
                                <th className="px-5 py-3 text-left">Cấp</th>
                                <th className="px-5 py-3 text-center w-28">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(cat => {
                                const isRoot = !cat.parentId;
                                const parent = cat.parentId ? categoryMap[cat.parentId] : null;

                                return (
                                    <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-4 text-gray-400 font-mono text-sm">#{cat.id}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {!isRoot && <span className="text-gray-300 text-xl leading-none">└</span>}
                                                <span className="font-semibold text-gray-800">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {parent ? (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                                                    <FolderTree size={11} /> {parent.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-sm italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${isRoot ? LEVEL_COLORS[0] : LEVEL_COLORS[1]}`}>
                                                {isRoot ? 'Danh mục gốc' : 'Danh mục con'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(cat)}
                                                    className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                                                    title="Sửa">
                                                    <Edit size={15} />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id)}
                                                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                                    title="Xóa">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-md font-semibold text-gray-700 mb-1.5">
                                    Tên danh mục <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" required
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Áo thun nam..."
                                />
                            </div>
                            <div>
                                <label className="block text-md font-semibold text-gray-700 mb-1.5">Danh mục cha</label>
                                <select
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                >
                                    <option value="">— Tạo danh mục gốc —</option>
                                    {categories
                                        .filter(c => c.id !== editingCategory?.id)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {!c.parentId ? '🌳 ' : '  📁 '}{c.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-1">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-md text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors cursor-pointer">
                                    Hủy
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 text-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl font-semibold transition-colors cursor-pointer shadow-sm">
                                    {saving ? 'Đang lưu...' : 'Lưu lại'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}