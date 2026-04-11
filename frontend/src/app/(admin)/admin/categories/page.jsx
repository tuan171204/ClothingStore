'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getCategoriesPaged, getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { Plus, Edit, Trash2, FolderTree, X, Search, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import Pagination from '@/components/admin/Pagination';

const PAGE_SIZE = 8;

const LEVEL_COLORS = [
    'bg-green-100 text-green-800 border border-green-200',
    'bg-blue-100 text-blue-800 border border-blue-200',
];

export default function CategoriesPage() {
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [allCategories, setAllCategories] = useState([]);
    const [page, setPage] = useState(0);

    const [keyword, setKeyword] = useState('');
    const [queryKeyword, setQueryKeyword] = useState('');

    const [levelFilter, setLevelFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const debounceRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', parentId: '' });
    const [saving, setSaving] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        const isRoot = levelFilter === 'root';
        const isChild = levelFilter === 'child';

        const res = await getCategoriesPaged({
            keyword: queryKeyword,
            parentOnly: isRoot,
            page: page,
            size: PAGE_SIZE
        });

        if (isChild && res.content) {
            res.content = res.content.filter(c => !!c.parentId);
        }
        setData(res);
        setLoading(false);
    }, [page, queryKeyword, levelFilter]);

    useEffect(() => {
        getCategories().then(cats => setAllCategories(Array.isArray(cats) ? cats : []));
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleKeywordChange = (val) => {
        setKeyword(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setQueryKeyword(val);
            setPage(0);
        }, 350);
    };

    const handleLevelChange = (lvl) => {
        setLevelFilter(lvl);
        setPage(0);
    };

    const categoryMap = Object.fromEntries(allCategories.map(c => [c.id, c]));

    const openModal = (category = null) => {
        setEditingCategory(category);
        setFormData(category
            ? { name: category.name, parentId: category.parentId || '' }
            : { name: '', parentId: '' });
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
            getCategories().then(cats => setAllCategories(Array.isArray(cats) ? cats : []));
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
            getCategories().then(cats => setAllCategories(Array.isArray(cats) ? cats : []));
            const newPage = data.content.length === 1 && page > 0 ? page - 1 : page;
            setPage(newPage);
            fetchCategories(newPage, keyword, levelFilter);
        } catch {
            toast.error('Lỗi khi xóa! Có thể danh mục đang có sản phẩm.');
        }
    };

    const rootCount = allCategories.filter(c => !c.parentId).length;
    const childCount = allCategories.filter(c => !!c.parentId).length;

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FolderTree size={20} className="text-blue-600" />
                        Quản lý Danh mục
                    </h1>
                    <p className="text-xs sm:text-md text-gray-500 mt-0.5">
                        {rootCount} gốc · {childCount} con · Trang {page + 1}/{data.totalPages || 1}
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer text-sm sm:text-md w-full sm:w-auto">
                    <Plus size={16} /> Thêm danh mục
                </button>
            </div>

            {/* TOOLBAR */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên danh mục..."
                            value={keyword}
                            onChange={e => handleKeywordChange(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 text-sm sm:text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        {keyword && (
                            <button onClick={() => handleKeywordChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button onClick={() => fetchCategories()}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:text-md border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white text-gray-600 cursor-pointer font-medium">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
                {/* Level filter pills — scrollable on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    <Layers size={13} className="text-gray-400 shrink-0" />
                    {[
                        { value: 'all', label: 'Tất cả', count: allCategories.length },
                        { value: 'root', label: '🌳 Gốc', count: rootCount },
                        { value: 'child', label: '📁 Con', count: childCount },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleLevelChange(opt.value)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer border whitespace-nowrap shrink-0
                                ${levelFilter === opt.value
                                    ? 'bg-blue-600 text-white border-transparent shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                                }`}>
                            {opt.label} <span className={levelFilter === opt.value ? 'text-blue-200' : 'text-gray-400'}>({opt.count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLE / CARDS */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <RefreshCw size={28} className="animate-spin text-blue-400" />
                    </div>
                ) : data.content.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <FolderTree size={40} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm">{keyword ? `Không tìm thấy "${keyword}"` : 'Chưa có danh mục nào'}</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: card list */}
                        <div className="block sm:hidden divide-y divide-gray-100">
                            {data.content.map(cat => {
                                const isRoot = !cat.parentId;
                                const parent = cat.parentId ? categoryMap[cat.parentId] : null;
                                return (
                                    <div key={cat.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {!isRoot && <span className="text-gray-300 text-lg leading-none">└</span>}
                                                <span className="font-semibold text-gray-800 text-sm truncate">{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isRoot ? LEVEL_COLORS[0] : LEVEL_COLORS[1]}`}>
                                                    {isRoot ? 'Gốc' : 'Con'}
                                                </span>
                                                {parent && (
                                                    <span className="text-xs text-gray-400 truncate">← {parent.name}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button onClick={() => openModal(cat)}
                                                className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(cat.id)}
                                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden sm:block">
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
                                    {data.content.map(cat => {
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
                                                        <span className="text-gray-300 text-md italic">—</span>
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
                                                            className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer">
                                                            <Edit size={15} />
                                                        </button>
                                                        <button onClick={() => handleDelete(cat.id)}
                                                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            page={page}
                            totalPages={data.totalPages}
                            totalElements={data.totalElements}
                            size={PAGE_SIZE}
                            onPageChange={setPage}
                            loading={loading}
                        />
                    </>
                )}
            </div>

            {/* MODAL — bottom sheet on mobile */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Tên danh mục <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" required
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm sm:text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Áo thun nam..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục cha</label>
                                <select
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm sm:text-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer"
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                >
                                    <option value="">— Tạo danh mục gốc —</option>
                                    {allCategories
                                        .filter(c => c.id !== editingCategory?.id)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {!c.parentId ? '🌳 ' : '  📁 '}{c.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-1 pb-2 sm:pb-0">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors cursor-pointer">
                                    Hủy
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl font-semibold transition-colors cursor-pointer shadow-sm">
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