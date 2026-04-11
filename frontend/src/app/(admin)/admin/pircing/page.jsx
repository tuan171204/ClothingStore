'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { Search, RefreshCw, DollarSign, Package, X, CheckSquare } from 'lucide-react';
import { getProductsWithFilter } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import axios from '@/lib/axios';
import Pagination from '@/components/admin/Pagination';

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

    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [pageSize] = useState(10);

    const [selectedSkus, setSelectedSkus] = useState([]);
    const [bulkMargin, setBulkMargin] = useState('');
    const [isBulkSaving, setIsBulkSaving] = useState(false);

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
            setSelectedSkus([]);

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

    const allActiveSkus = products.flatMap(p => (p.skus || []).filter(s => s.isActive !== false));
    const isAllSelected = allActiveSkus.length > 0 && selectedSkus.length === allActiveSkus.length;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSkus(allActiveSkus.map(s => s.id));
        } else {
            setSelectedSkus([]);
        }
    };

    const handleSelectSku = (skuId) => {
        setSelectedSkus(prev => prev.includes(skuId) ? prev.filter(id => id !== skuId) : [...prev, skuId]);
    };

    const handleBulkSave = async () => {
        const margin = parseFloat(bulkMargin);
        if (isNaN(margin) || margin < 0) {
            toast.error('Vui lòng nhập tỷ lệ lợi nhuận hợp lệ (>= 0)!');
            return;
        }
        setIsBulkSaving(true);
        try {
            await Promise.all(selectedSkus.map(id =>
                axios.patch(`/products/skus/${id}/profit-margin`, { profitMargin: margin })
            ));
            toast.success(`Đã áp dụng lợi nhuận ${margin}% cho ${selectedSkus.length} phân loại!`);
            setSelectedSkus([]);
            setBulkMargin('');
            fetchData();
        } catch (err) {
            toast.error('Có lỗi xảy ra khi cập nhật hàng loạt!');
        } finally {
            setIsBulkSaving(false);
        }
    };

    const calcSellingPrice = (importPrice, margin) => {
        if (!importPrice || margin == null) return null;
        return importPrice * (1 + margin / 100);
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign size={22} className="text-green-600" /> Quản lý Giá Bán
                    </h1>
                    <p className="text-xs sm:text-md text-gray-500 mt-1 hidden sm:block">
                        Thiết lập tỷ lệ lợi nhuận → Giá bán tự động tính dựa trên Giá nhập kho (GRN)
                    </p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium cursor-pointer">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 flex flex-col gap-3">
                <div className="relative w-full">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Tìm sản phẩm..." value={keyword} onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        <option value="">Tất cả Danh mục</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={brandId} onChange={e => setBrandId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        <option value="">Tất cả Thương hiệu</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>

            {/* BULK ACTION BAR */}
            {selectedSkus.length > 0 && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-3 mb-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                            <CheckSquare size={16} className="text-green-600" />
                            Đang chọn <span className="font-bold text-green-700">{selectedSkus.length}</span> phân loại
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Lợi nhuận:</span>
                            <div className="relative flex-1 sm:flex-none">
                                <input
                                    type="number" min="0" max="1000"
                                    className="w-full sm:w-24 border border-green-400 rounded-md pl-3 pr-7 py-2 text-sm font-bold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={bulkMargin}
                                    onChange={e => setBulkMargin(e.target.value)}
                                    placeholder="VD: 30"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 font-bold text-sm">%</span>
                            </div>
                            <button
                                onClick={handleBulkSave}
                                disabled={isBulkSaving}
                                className="bg-green-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                            >
                                {isBulkSaving ? <RefreshCw size={13} className="animate-spin" /> : null}
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table — desktop full, mobile card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Mobile: card-style rows */}
                <div className="block sm:hidden">
                    {/* Select all for mobile */}
                    <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
                        <input type="checkbox" className="w-4 h-4 cursor-pointer accent-green-600"
                            checked={isAllSelected} onChange={handleSelectAll} />
                        <span className="text-xs text-gray-600 font-medium">Chọn tất cả ({allActiveSkus.length})</span>
                    </div>
                    {loading ? (
                        <div className="py-10 text-center text-gray-400 text-sm">Đang tải...</div>
                    ) : products.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">Không tìm thấy dữ liệu</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {products.flatMap(product =>
                                (product.skus || []).filter(sku => sku.isActive !== false).map(sku => {
                                    const isSelected = selectedSkus.includes(sku.id);
                                    const displayPrice = sku.price > 0 ? sku.price : calcSellingPrice(sku.importPrice, sku.profitMargin);
                                    return (
                                        <div key={sku.id} className={`p-3 flex items-start gap-3 ${isSelected ? 'bg-green-50/30' : ''}`}>
                                            <input type="checkbox" className="w-4 h-4 cursor-pointer accent-green-600 mt-1 shrink-0"
                                                checked={isSelected} onChange={() => handleSelectSku(sku.id)} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{sku.skuName || sku.code}</p>
                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                    <span className="text-xs text-gray-400">Nhập: {sku.importPrice && sku.importPrice > 0 ? formatCurrency(sku.importPrice) : '—'}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded font-bold border ${sku.profitMargin != null ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                                        {sku.profitMargin != null ? `${sku.profitMargin}%` : 'Chưa set'}
                                                    </span>
                                                    {displayPrice && <span className="font-bold text-blue-600 text-sm">{formatCurrency(displayPrice)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Desktop: full table */}
                <div className="hidden sm:block">
                    <table className="w-full text-md text-left">
                        <thead className="bg-gray-50 border-b text-sm text-gray-500 uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <input type="checkbox" className="w-4 h-4 cursor-pointer accent-green-600"
                                        checked={isAllSelected} onChange={handleSelectAll} />
                                </th>
                                <th className="px-4 py-3">Sản phẩm / SKU</th>
                                <th className="px-4 py-3">Mã SKU</th>
                                <th className="px-4 py-3 text-right">Giá nhập kho</th>
                                <th className="px-4 py-3 text-center text-green-600">Tỷ lệ Lợi Nhuận</th>
                                <th className="px-4 py-3 text-right text-blue-600">Giá bán Website</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-400" /> Đang tải...
                                </td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                                    <Package size={36} className="mx-auto mb-2 text-gray-200" /> Không tìm thấy dữ liệu
                                </td></tr>
                            ) : (
                                products.flatMap(product =>
                                    (product.skus || []).filter(sku => sku.isActive !== false).map(sku => {
                                        const isSelected = selectedSkus.includes(sku.id);
                                        const displayPrice = sku.price > 0 ? sku.price : calcSellingPrice(sku.importPrice, sku.profitMargin);
                                        return (
                                            <tr key={sku.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50/20' : ''}`}>
                                                <td className="px-4 py-3 text-center">
                                                    <input type="checkbox" className="w-4 h-4 cursor-pointer accent-green-600"
                                                        checked={isSelected} onChange={() => handleSelectSku(sku.id)} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-800">{product.name}</div>
                                                    <div className="text-sm font-semibold text-gray-500 mt-0.5">{sku.skuName || sku.optionValues?.map(v => v.value).join(' - ')}</div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm text-gray-500">{sku.code}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {sku.importPrice && sku.importPrice > 0
                                                        ? <span className="font-medium text-gray-700">{formatCurrency(sku.importPrice)}</span>
                                                        : <span className="text-gray-300 text-sm italic">Chưa có</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-md text-md font-bold border 
                                                        ${sku.profitMargin != null ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                                        {sku.profitMargin != null ? `${sku.profitMargin}%` : 'Chưa set'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {displayPrice
                                                        ? <span className="font-bold text-blue-600 text-base">{formatCurrency(displayPrice)}</span>
                                                        : <span className="text-gray-300 text-sm italic">—</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    size={pageSize}
                    onPageChange={setPage}
                    loading={loading}
                />
            </div>
        </div>
    );
}