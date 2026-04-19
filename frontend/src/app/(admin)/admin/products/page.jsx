'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
    Search, Filter, X, ChevronLeft, ChevronRight,
    RefreshCw, Plus, Edit, Trash2, Package, Tag,
    Layers, Image as ImageIcon
} from 'lucide-react';
import { getProductsWithFilter, deleteProduct, formatCurrency } from '@/services/productService';
import { getBrands } from '@/services/brandService';
import { getCategories } from '@/services/categoryService';

const PAGE_SIZE_OPTIONS = [8, 12, 24, 48];

export default function AdminProductPage() {
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);

    const debounceTimer = useRef(null);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [cats, brds] = await Promise.all([getCategories(), getBrands()]);
                setCategories(cats?.result || cats || []);
                setBrands(brds?.result || brds || []);
            } catch (error) {
                console.error('Lỗi tải bộ lọc', error);
            }
        };
        fetchFilters();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: pageSize };
            if (keyword.trim()) params.keyword = keyword.trim();
            if (categoryId) params.categoryId = categoryId;
            if (brandId) params.brandId = brandId;

            const data = await getProductsWithFilter(params);

            const resultData = data?.result || data;
            setProducts(resultData.products || []);
            setTotalPages(resultData.totalPages || 0);
            setTotalElements(resultData.totalElements || 0);
        } catch (err) {
            toast.error('Không tải được dữ liệu sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [keyword, categoryId, brandId, page, pageSize]);

    useEffect(() => {
        setPage(0);
    }, [keyword, categoryId, brandId, pageSize]);

    useEffect(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchData();
        }, 400);

        return () => clearTimeout(debounceTimer.current);
    }, [fetchData]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" không? Thao tác này không thể hoàn tác.`)) return;
        try {
            await deleteProduct(id);
            toast.success('Đã xóa sản phẩm thành công!');
            fetchData();
        } catch (error) {
            toast.error('Xóa thất bại! Có thể sản phẩm này đã phát sinh đơn hàng.');
        }
    };

    const clearFilters = () => {
        setKeyword('');
        setCategoryId('');
        setBrandId('');
        setPage(0);
    };

    const hasActiveFilter = keyword || categoryId || brandId;

    const getCategoryLabel = () => categories.find(c => c.id === parseInt(categoryId))?.name || categoryId;
    const getBrandLabel = () => brands.find(b => b.id === parseInt(brandId))?.name || brandId;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-screen-xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">

                {/* ── PAGE TITLE ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
                        <p className="text-xs sm:text-md text-gray-500 mt-0.5 hidden sm:block">
                            Kho hàng, giá bán và phân loại sản phẩm
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-md font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Làm mới</span>
                        </button>
                        <Link
                            href="/admin/products/create"
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-md font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex-1 sm:flex-none justify-center sm:justify-start"
                        >
                            <Plus size={16} /> <span>Thêm sản phẩm</span>
                        </Link>
                    </div>
                </div>

                {/* ── SUMMARY CARDS ── */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <SummaryCard
                        icon={<Package size={18} className="text-blue-500 sm:w-[22px] sm:h-[22px]" />}
                        label="Tổng sản phẩm"
                        value={totalElements}
                        bg="bg-blue-50"
                    />
                    <SummaryCard
                        icon={<Layers size={18} className="text-purple-500 sm:w-[22px] sm:h-[22px]" />}
                        label="Danh mục"
                        value={categories.length}
                        bg="bg-purple-50"
                    />
                    <SummaryCard
                        icon={<Tag size={18} className="text-green-500 sm:w-[22px] sm:h-[22px]" />}
                        label="Thương hiệu"
                        value={brands.length}
                        bg="bg-green-50"
                    />
                </div>

                {/* ── FILTER TOOLBAR ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4 space-y-3">
                    <div className="flex flex-col gap-2 sm:gap-3">
                        {/* Search — full width on mobile */}
                        <div className="relative w-full">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên sản phẩm..."
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            />
                            {keyword && (
                                <button onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Filters row — stacked on mobile, inline on md+ */}
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="px-3 py-2.5 text-xs sm:text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            >
                                <option value="">Tất cả Danh mục</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select
                                value={brandId}
                                onChange={e => setBrandId(e.target.value)}
                                className="px-3 py-2.5 text-xs sm:text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            >
                                <option value="">Tất cả Thương hiệu</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>

                            <select
                                value={pageSize}
                                onChange={e => setPageSize(Number(e.target.value))}
                                className="px-3 py-2.5 text-xs sm:text-md border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white col-span-2 sm:col-span-1 sm:w-32"
                            >
                                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / trang</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Active filters */}
                    {hasActiveFilter && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                            <Filter size={13} className="text-gray-400" />
                            <span className="text-xs sm:text-sm text-gray-500">Đang lọc:</span>
                            {keyword && <FilterChip label={`"${keyword}"`} onRemove={() => setKeyword('')} />}
                            {categoryId && <FilterChip label={`DM: ${getCategoryLabel()}`} onRemove={() => setCategoryId('')} />}
                            {brandId && <FilterChip label={`TH: ${getBrandLabel()}`} onRemove={() => setBrandId('')} />}
                            <button onClick={clearFilters} className="ml-auto text-xs sm:text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                                <X size={12} /> Xóa tất cả
                            </button>
                        </div>
                    )}
                </div>

                {/* ── TABLE (desktop) / CARDS (mobile) ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Mobile: Card List */}
                    <div className="block sm:hidden">
                        {loading ? (
                            <div className="py-12 text-center">
                                <RefreshCw size={24} className="animate-spin text-blue-400 mx-auto mb-2" />
                                <span className="text-xs text-gray-400">Đang tải...</span>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <Package size={36} className="mx-auto mb-2 text-gray-200" />
                                <p className="text-xs">Không tìm thấy sản phẩm</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {products.map(product => (
                                    <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                                        <div className="w-12 h-12 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                                            {product.thumbnail
                                                ? <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                                : <ImageIcon size={18} className="text-gray-300" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-xs truncate">{product.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                {product.categoryName || '—'} · {product.brandName || '—'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-bold text-blue-600 text-xs">{formatCurrency(product.basePrice)}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {product.isActive ? 'Đang bán' : 'Đã ẩn'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <Link href={`/admin/products/edit/${product.id}`}
                                                className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors">
                                                <Edit size={15} />
                                            </Link>
                                            <button onClick={() => handleDelete(product.id, product.name)}
                                                className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-md text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-center w-16">ID</th>
                                    <th className="px-4 py-3 w-20">Ảnh</th>
                                    <th className="px-4 py-3 min-w-[250px]">Tên sản phẩm</th>
                                    <th className="px-4 py-3">Danh mục</th>
                                    <th className="px-4 py-3">Thương hiệu</th>
                                    <th className="px-4 py-3 text-right">Giá gốc</th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                    <th className="px-4 py-3 text-center w-28">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <RefreshCw size={28} className="animate-spin text-blue-400" />
                                                <span className="text-md">Đang tải dữ liệu...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <Package size={40} className="text-gray-200" />
                                                <span className="text-md">Không tìm thấy sản phẩm nào</span>
                                                {hasActiveFilter && (
                                                    <button onClick={clearFilters} className="text-blue-500 text-sm hover:underline">
                                                        Xóa bộ lọc và thử lại
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(product => (
                                        <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-center font-mono text-gray-500">{product.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="w-12 h-12 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
                                                    {product.thumbnail ? (
                                                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon size={20} className="text-gray-300" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800 line-clamp-2 leading-tight" title={product.name}>
                                                    {product.name}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {product.categoryName || <span className="text-gray-400 italic">Trống</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {product.brandName || <span className="text-gray-400 italic">Trống</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-bold text-blue-600">
                                                    {formatCurrency(product.basePrice)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {product.isActive ? 'Đang bán' : 'Đã ẩn'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Link
                                                        href={`/admin/products/edit/${product.id}`}
                                                        title="Chỉnh sửa"
                                                        className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                        title="Xóa sản phẩm"
                                                        className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── PAGINATION ── */}
                    {totalPages > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-5 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/50">
                            <p className="text-xs sm:text-md text-gray-500">
                                Hiển thị{' '}
                                <span className="font-semibold text-gray-700">
                                    {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)}
                                </span>
                                {' '}trong{' '}
                                <span className="font-semibold text-gray-700">{totalElements}</span> sản phẩm
                            </p>

                            <div className="flex items-center gap-1">
                                <PaginationBtn onClick={() => setPage(0)} disabled={page === 0} label="«" />
                                <PaginationBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} label={<ChevronLeft size={16} />} />
                                {generatePageNumbers(page, totalPages).map((p, i) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-xs">…</span>
                                    ) : (
                                        <PaginationBtn key={p} onClick={() => setPage(p)} active={p === page} label={p + 1} />
                                    )
                                )}
                                <PaginationBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} label={<ChevronRight size={16} />} />
                                <PaginationBtn onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} label="»" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const SummaryCard = ({ icon, label, value, bg }) => (
    <div className={`${bg} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-4 border border-white shadow-sm`}>
        <div className="shrink-0 p-1.5 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl">{icon}</div>
        <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 truncate">{label}</p>
            <p className="font-bold text-gray-900 text-md sm:text-2xl leading-none">{value}</p>
        </div>
    </div>
);

const FilterChip = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
        {label}
        <button onClick={onRemove} className="hover:text-blue-900 cursor-pointer"><X size={10} /></button>
    </span>
);

const PaginationBtn = ({ onClick, disabled, active, label }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`min-w-[30px] sm:min-w-[34px] h-[30px] sm:h-[34px] px-1.5 sm:px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${active
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
        {label}
    </button>
);

function generatePageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages = new Set([0, total - 1, current]);
    for (let i = Math.max(0, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.add(i);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
        result.push(sorted[i]);
    }
    return result;
}