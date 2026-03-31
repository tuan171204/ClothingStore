'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { Search, RefreshCw, DollarSign, Package, Edit2, X, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
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

    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [pageSize] = useState(10);

    // BULK EDIT STATES
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
            setSelectedSkus([]); // Reset select khi đổi trang/filter

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

    // --- LOGIC CHECKBOX ---
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

    // --- BULK SAVE LOGIC ---
    const handleBulkSave = async () => {
        const margin = parseFloat(bulkMargin);
        if (isNaN(margin) || margin < 0) {
            toast.error('Vui lòng nhập tỷ lệ lợi nhuận hợp lệ (>= 0)!');
            return;
        }

        setIsBulkSaving(true);
        try {
            // Chạy API song song cho tất cả các SKU được chọn
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
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign size={24} className="text-green-600" /> Quản lý Giá Bán
                    </h1>
                    <p className="text-md text-gray-500 mt-1">
                        Thiết lập tỷ lệ lợi nhuận → Giá bán tự động tính dựa trên Giá nhập kho (GRN)
                    </p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-md font-medium cursor-pointer">
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Tìm sản phẩm..." value={keyword} onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-md" />
                </div>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-md outline-none focus:ring-2 focus:ring-blue-400 bg-white w-48">
                    <option value="">Tất cả Danh mục</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={brandId} onChange={e => setBrandId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-md outline-none focus:ring-2 focus:ring-blue-400 bg-white w-48">
                    <option value="">Tất cả Thương hiệu</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            {/* BULK ACTION BAR (Nổi lên khi có Checkbox được chọn) */}
            {selectedSkus.length > 0 && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2 text-green-800 font-medium text-md">
                        <CheckSquare size={18} className="text-green-600" />
                        Đang chọn <span className="font-bold text-green-700">{selectedSkus.length}</span> phân loại
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-md text-gray-600 font-medium">Set Lợi nhuận chung:</span>
                        <div className="relative">
                            <input
                                type="number" min="0" max="1000"
                                className="w-24 border border-green-400 rounded-md pl-3 pr-7 py-1.5 text-md font-bold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={bulkMargin}
                                onChange={e => setBulkMargin(e.target.value)}
                                placeholder="VD: 30"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 font-bold">%</span>
                        </div>
                        <button
                            onClick={handleBulkSave}
                            disabled={isBulkSaving}
                            className="bg-green-600 text-white px-5 py-1.5 rounded-md font-bold text-md hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                            {isBulkSaving ? <RefreshCw size={14} className="animate-spin" /> : null}
                            ÁP DỤNG NGAY
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-md text-left">
                    <thead className="bg-gray-50 border-b text-sm text-gray-500 uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3 w-10 text-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 cursor-pointer accent-green-600"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                />
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

                                    // Giá bán hiển thị realtime nếu chưa có giá (nhập nháp)
                                    const displayPrice = sku.price > 0 ? sku.price : calcSellingPrice(sku.importPrice, sku.profitMargin);

                                    return (
                                        <tr key={sku.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50/20' : ''}`}>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 cursor-pointer accent-green-600"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectSku(sku.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{product.name}</div>
                                                <div className="text-sm font-semibold text-gray-500 mt-0.5">{sku.skuName || sku.optionValues?.map(v => v.value).join(' - ')}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm text-gray-500">{sku.code}</td>
                                            <td className="px-4 py-3 text-right">
                                                {sku.importPrice && sku.importPrice > 0
                                                    ? <span className="font-medium text-gray-700">{formatCurrency(sku.importPrice)}</span>
                                                    : <span className="text-gray-300 text-sm italic">Chưa có (Chờ nhập kho)</span>
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

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50/50">
                        <p className="text-md text-gray-500">
                            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} / {totalElements} sản phẩm
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-md font-medium">{page + 1}</span>
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