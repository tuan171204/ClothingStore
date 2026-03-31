'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { Search, RefreshCw, DollarSign, TrendingUp, Package, Save, Edit2, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getProductsWithFilter } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import axios from '@/lib/axios';

const formatCurrency = (v) =>
    v != null && v !== 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

export default function PricingManagementPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);

    // Filter state
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [pageSize] = useState(10);

    // Edit state
    const [editingSkuId, setEditingSkuId] = useState(null);
    const [editMargin, setEditMargin] = useState('');
    const [savingSkuId, setSavingSkuId] = useState(null);

    const debounceTimer = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: pageSize };
            if (keyword.trim()) params.keyword = keyword.trim();
            if (categoryId) params.categoryId = categoryId;
            if (brandId) params.brandId = brandId;

            const [data, cats, brds] = await Promise.all([
                getProductsWithFilter(params),
                categories.length === 0 ? getCategories() : Promise.resolve(categories),
                brands.length === 0 ? getBrands() : Promise.resolve(brands),
            ]);

            const result = data?.result || data;
            setProducts(result.products || []);
            setTotalPages(result.totalPages || 0);
            setTotalElements(result.totalElements || 0);

            if (categories.length === 0) setCategories(cats?.result || cats || []);
            if (brands.length === 0) setBrands(brds?.result || brds || []);
        } catch {
            toast.error('Lỗi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, keyword, categoryId, brandId]);

    useEffect(() => { setPage(0); }, [keyword, categoryId, brandId]);

    useEffect(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(fetchData, 400);
        return () => clearTimeout(debounceTimer.current);
    }, [fetchData]);

    const handleStartEdit = (sku) => {
        setEditingSkuId(sku.id);
        setEditMargin(sku.profitMargin != null ? String(sku.profitMargin) : '');
    };

    const handleSaveMargin = async (skuId, productName) => {
        const margin = parseFloat(editMargin);
        if (isNaN(margin) || margin < 0 || margin > 1000) {
            toast.error('Tỷ lệ lợi nhuận phải từ 0% đến 1000%!');
            return;
        }
        setSavingSkuId(skuId);
        try {
            await axios.patch(`/products/skus/${skuId}/profit-margin`, { profitMargin: margin });
            toast.success(`Đã cập nhật tỷ lệ lợi nhuận cho ${productName}!`);
            setEditingSkuId(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi cập nhật!');
        } finally {
            setSavingSkuId(null);
        }
    };

    // Tính giá bán gợi ý
    const calcSellingPrice = (importPrice, margin) => {
        if (!importPrice || !margin) return null;
        return importPrice * (1 + margin / 100);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign size={24} className="text-green-600" /> Quản lý Giá Bán
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Thiết lập tỷ lệ lợi nhuận → Giá bán tự động tính khi nhập hàng
                    </p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
            </div>

            {/* Formula info */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
                <strong>Công thức giá bán:</strong>{' '}
                Giá bán = Giá nhập bình quân × (100% + Tỷ lệ lợi nhuận %)
                <span className="ml-4 text-green-600">Ví dụ: Giá nhập 100.000đ × (100% + 30%) = 130.000đ</span>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Tìm sản phẩm..." value={keyword} onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                </div>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white w-48">
                    <option value="">Tất cả Danh mục</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={brandId} onChange={e => setBrandId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white w-48">
                    <option value="">Tất cả Thương hiệu</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3">Sản phẩm / SKU</th>
                            <th className="px-4 py-3">Mã SKU</th>
                            <th className="px-4 py-3 text-right">Giá nhập bình quân</th>
                            <th className="px-4 py-3 text-center text-green-600">Tỷ lệ LN (%)</th>
                            <th className="px-4 py-3 text-right text-blue-600">Giá bán hiện tại</th>
                            <th className="px-4 py-3 text-right text-gray-400">Giá bán gợi ý</th>
                            <th className="px-4 py-3 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-400" />
                                Đang tải...
                            </td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                                <Package size={36} className="mx-auto mb-2 text-gray-200" />
                                Không tìm thấy sản phẩm nào
                            </td></tr>
                        ) : (
                            products.flatMap(product =>
                                (product.skus || []).filter(sku => sku.isActive !== false).map(sku => {
                                    const isEditing = editingSkuId === sku.id;
                                    const suggestedPrice = calcSellingPrice(sku.importPrice, isEditing ? parseFloat(editMargin) : sku.profitMargin);

                                    return (
                                        <tr key={sku.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-green-50/30' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{product.name}</div>
                                                <div className="text-xs text-gray-500">{sku.skuName || sku.optionValues?.map(v => v.value).join(' - ')}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{sku.code}</td>
                                            <td className="px-4 py-3 text-right">
                                                {sku.importPrice && sku.importPrice > 0
                                                    ? <span className="font-medium text-gray-700">{formatCurrency(sku.importPrice)}</span>
                                                    : <span className="text-gray-300 text-xs italic">Chưa nhập hàng</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input
                                                            type="number" min="0" max="1000" step="0.5"
                                                            className="w-20 border-2 border-green-400 rounded-lg px-2 py-1 text-center font-bold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                                                            value={editMargin}
                                                            onChange={e => setEditMargin(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <span className="text-green-600 font-bold">%</span>
                                                    </div>
                                                ) : (
                                                    <span className={`font-bold ${sku.profitMargin != null ? 'text-green-600' : 'text-gray-300'}`}>
                                                        {sku.profitMargin != null ? `${sku.profitMargin}%` : '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {sku.price && sku.price > 0
                                                    ? <span className="font-bold text-blue-600">{formatCurrency(sku.price)}</span>
                                                    : <span className="text-gray-300 text-xs italic">Chưa có</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {suggestedPrice
                                                    ? <span className="text-gray-500 text-xs">{formatCurrency(Math.ceil(suggestedPrice / 1000) * 1000)}</span>
                                                    : <span className="text-gray-200 text-xs">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleSaveMargin(sku.id, product.name)}
                                                                disabled={savingSkuId === sku.id}
                                                                className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors cursor-pointer disabled:opacity-50"
                                                                title="Lưu"
                                                            >
                                                                {savingSkuId === sku.id ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                                            </button>
                                                            <button onClick={() => setEditingSkuId(null)} className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors cursor-pointer" title="Hủy">
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => handleStartEdit(sku)} className="p-2 rounded-lg bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 transition-colors cursor-pointer" title="Sửa tỷ lệ lợi nhuận">
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} / {totalElements} sản phẩm
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{page + 1}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}