'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getBrandsPaged, createBrand, updateBrand, deleteBrand } from '@/services/brandService';
import { Plus, Edit, Trash2, Tag, X, Search, RefreshCw, ImageOff } from 'lucide-react';
import { toast } from 'react-toastify';
import ImageUpload from '@/components/admin/ImageUpload';
import Pagination from '@/components/admin/Pagination';

const PAGE_SIZE = 8;

export default function BrandsPage() {
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);

    const [keyword, setKeyword] = useState('');
    const [queryKeyword, setQueryKeyword] = useState('');

    const [loading, setLoading] = useState(true);
    const debounceRef = useRef(null);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({ name: '', logo: '' });
    const [saving, setSaving] = useState(false);

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        const res = await getBrandsPaged({ keyword: queryKeyword, page: page, size: PAGE_SIZE });
        setData(res);
        setLoading(false);
    }, [page, queryKeyword]); // Đủ dependencies

    // 2. Cập nhật state sau khi chờ
    const handleKeywordChange = (val) => {
        setKeyword(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setQueryKeyword(val);
            setPage(0);
        }, 350);
    };

    // 3. Effect chạy khi fetchBrands thay đổi
    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const openModal = (brand = null) => {
        setEditingBrand(brand);
        setFormData(brand ? { name: brand.name, logo: brand.logo || '' } : { name: '', logo: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingBrand) {
                await updateBrand(editingBrand.id, formData);
                toast.success('Cập nhật thương hiệu thành công!');
            } else {
                await createBrand(formData);
                toast.success('Thêm thương hiệu thành công!');
            }
            setIsModalOpen(false);
            fetchBrands();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;
        try {
            await deleteBrand(id);
            toast.success('Xóa thương hiệu thành công!');
            // If last item on page, go back one page
            const newPage = data.content.length === 1 && page > 0 ? page - 1 : page;
            setPage(newPage);
            fetchBrands(newPage, keyword);
        } catch {
            toast.error('Lỗi khi xóa thương hiệu!');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tag size={22} className="text-purple-600" />
                        Quản lý Thương hiệu
                    </h1>
                    <p className="text-md text-gray-500 mt-0.5">
                        {data.totalElements} thương hiệu · Trang {page + 1}/{data.totalPages || 1}
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer text-md">
                    <Plus size={17} /> Thêm thương hiệu
                </button>
            </div>

            {/* ── TOOLBAR ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tên thương hiệu..."
                        value={keyword}
                        onChange={e => handleKeywordChange(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    {keyword && (
                        <button onClick={() => handleKeywordChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => fetchBrands()}
                    className="flex items-center gap-2 px-4 py-2.5 text-md border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white text-gray-600 cursor-pointer font-medium">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Làm mới
                </button>
            </div>

            {/* ── TABLE ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <RefreshCw size={28} className="animate-spin text-purple-400" />
                    </div>
                ) : data.content.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <Tag size={40} className="mx-auto mb-3 text-gray-200" />
                        <p>{keyword ? `Không tìm thấy thương hiệu "${keyword}"` : 'Chưa có thương hiệu nào'}</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-md">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left w-16">ID</th>
                                    <th className="px-5 py-3 text-left w-24">Logo</th>
                                    <th className="px-5 py-3 text-left">Tên thương hiệu</th>
                                    <th className="px-5 py-3 text-center w-28">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.content.map(brand => (
                                    <tr key={brand.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-4 text-gray-400 font-mono text-sm">#{brand.id}</td>
                                        <td className="px-5 py-4">
                                            <div className="w-12 h-12 rounded-xl border bg-gray-50 overflow-hidden flex items-center justify-center shadow-sm">
                                                {brand.logo ? (
                                                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageOff size={18} className="text-gray-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-semibold text-gray-800">{brand.name}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(brand)}
                                                    className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer" title="Sửa">
                                                    <Edit size={15} />
                                                </button>
                                                <button onClick={() => handleDelete(brand.id)}
                                                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer" title="Xóa">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

            {/* ── MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingBrand ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-md font-semibold text-gray-700 mb-1.5">
                                    Tên thương hiệu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" required
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Coolmate, Owen..."
                                />
                            </div>
                            <div>
                                <label className="block text-md font-semibold text-gray-700 mb-1.5">Logo thương hiệu</label>
                                <ImageUpload
                                    value={formData.logo}
                                    onUpload={url => setFormData({ ...formData, logo: url })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-md text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors cursor-pointer">
                                    Hủy
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 text-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-xl font-semibold transition-colors cursor-pointer shadow-sm">
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