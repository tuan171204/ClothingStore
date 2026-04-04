'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Search, Filter, Check, Loader2, Package, Tag, FolderTree, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'react-toastify';

// ─── Helpers ────────────────────────────────────────────────────
const formatCurrency = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';

async function fetchProducts({ keyword, categoryId, brandId, page, size }) {
    const params = { page, limit: size };
    if (keyword?.trim()) params.keyword = keyword.trim();
    if (categoryId) params.categoryId = categoryId;
    if (brandId) params.brandId = brandId;
    const res = await axios.get('/products/filter', { params });
    return res.data; // { products, totalPages, totalElements }
}

async function fetchCategories() {
    const res = await axios.get('/categories');
    return res.data || [];
}

async function fetchBrands() {
    const res = await axios.get('/brands');
    return res.data || [];
}

async function saveCouponProducts(couponId, productIds) {
    const res = await axios.put(`/coupons/${couponId}/products`, { productIds: [...productIds] });
    return res.data;
}

// ─── Main Component ──────────────────────────────────────────────
/**
 * CouponProductMappingModal
 *
 * Props:
 *   coupon        — full coupon object (must have applyType === 'PRODUCT')
 *   onClose       — () => void
 *   onSaveSuccess — () => void  (called after successful save)
 */
export default function CouponProductMappingModal({ coupon, onClose, onSaveSuccess }) {
    // Filter state
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 8;

    // Data
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingFilters, setLoadingFilters] = useState(true);

    // Selection — initialise from coupon.appliedProductIds
    const [selected, setSelected] = useState(() => new Set(coupon.appliedProductIds || []));
    const [saving, setSaving] = useState(false);

    const debounceRef = useRef(null);

    // Load filter dropdowns once
    useEffect(() => {
        Promise.all([fetchCategories(), fetchBrands()])
            .then(([cats, brds]) => {
                setCategories(cats);
                setBrands(brds);
            })
            .finally(() => setLoadingFilters(false));
    }, []);

    // Load products on filter/page change (debounced on keyword)
    const loadProducts = useCallback(async (pg = page) => {
        setLoadingProducts(true);
        try {
            const data = await fetchProducts({ keyword, categoryId, brandId, page: pg, size: PAGE_SIZE });
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch {
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoadingProducts(false);
        }
    }, [keyword, categoryId, brandId, page]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadProducts(0), keyword ? 350 : 0);
        return () => clearTimeout(debounceRef.current);
    }, [keyword, categoryId, brandId]);

    useEffect(() => { loadProducts(page); }, [page]);

    // Toggle single
    const toggle = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Select / deselect entire current page
    const togglePage = () => {
        const pageIds = products.map(p => p.id);
        const allSelected = pageIds.every(id => selected.has(id));
        setSelected(prev => {
            const next = new Set(prev);
            pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
            return next;
        });
    };

    const clearAll = () => setSelected(new Set());

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveCouponProducts(coupon.id, selected);
            toast.success(`Đã lưu ${selected.size} sản phẩm cho mã ${coupon.code}`);
            onSaveSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const pageIds = products.map(p => p.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
    const somePageSelected = pageIds.some(id => selected.has(id)) && !allPageSelected;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Gán sản phẩm cho mã{' '}
                            <span className="font-mono text-purple-700">{coupon.code}</span>
                        </h2>
                        <p className="text-md text-gray-500 mt-0.5">
                            Chọn sản phẩm sẽ được giảm giá khi khách dùng mã này.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors cursor-pointer ml-4 shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/* ── Filter bar ── */}
                <div className="px-6 py-3 border-b bg-white shrink-0 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên sản phẩm..."
                            value={keyword}
                            onChange={e => { setKeyword(e.target.value); setPage(0); }}
                            className="w-full pl-9 pr-4 py-2 text-md border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>
                    <select
                        value={categoryId}
                        onChange={e => { setCategoryId(e.target.value); setPage(0); }}
                        disabled={loadingFilters}
                        className="px-3 py-2 text-md border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-w-[160px]"
                    >
                        <option value=""><FolderTree size={12} className="inline mr-1" /> Tất cả danh mục</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                        value={brandId}
                        onChange={e => { setBrandId(e.target.value); setPage(0); }}
                        disabled={loadingFilters}
                        className="px-3 py-2 text-md border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-w-[140px]"
                    >
                        <option value=""><Tag size={12} className="inline mr-1" /> Tất cả thương hiệu</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                {/* ── Bulk action bar ── */}
                <div className="px-6 py-2 bg-purple-50 border-b shrink-0 flex items-center justify-between gap-3 text-md">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={allPageSelected}
                                ref={el => { if (el) el.indeterminate = somePageSelected; }}
                                onChange={togglePage}
                                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                            />
                            <span className="text-gray-700 font-medium">
                                Chọn trang hiện tại ({products.length})
                            </span>
                        </label>
                        {selected.size > 0 && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-sm font-bold">
                                {selected.size} đã chọn
                            </span>
                        )}
                    </div>
                    {selected.size > 0 && (
                        <button
                            onClick={clearAll}
                            className="text-sm text-gray-500 hover:text-red-600 font-medium cursor-pointer transition-colors"
                        >
                            Bỏ chọn tất cả
                        </button>
                    )}
                </div>

                {/* ── Product list ── */}
                <div className="flex-1 overflow-y-auto px-6 py-3">
                    {loadingProducts ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 size={26} className="animate-spin text-purple-400" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-gray-400">
                            <Package size={40} className="opacity-20 mb-3" />
                            <p className="text-md">Không tìm thấy sản phẩm nào</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {products.map(product => {
                                const isChosen = selected.has(product.id);
                                return (
                                    <label
                                        key={product.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none
                                            ${isChosen
                                                ? 'border-purple-400 bg-purple-50/60'
                                                : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChosen}
                                            onChange={() => toggle(product.id)}
                                            className="w-4 h-4 rounded accent-purple-600 shrink-0 cursor-pointer"
                                        />

                                        {/* Thumbnail */}
                                        <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                                            {product.thumbnail
                                                ? <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                                                : <Package size={18} className="text-gray-300" />
                                            }
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-md font-semibold text-gray-900 truncate">{product.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {product.brandName && (
                                                    <span className="text-sm text-gray-500">{product.brandName}</span>
                                                )}
                                                {product.categoryName && (
                                                    <span className="text-sm px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                        {product.categoryName}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-purple-700 mt-0.5">
                                                {formatCurrency(product.basePrice)}
                                            </p>
                                        </div>

                                        {/* Check indicator */}
                                        {isChosen && (
                                            <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                                <Check size={11} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="px-6 py-2 border-t bg-gray-50 shrink-0 flex items-center justify-between text-md">
                        <span className="text-gray-500">
                            Trang {page + 1}/{totalPages} · {totalElements} sản phẩm
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-sm font-semibold border transition-colors cursor-pointer
                                            ${p === page ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}
                                    >
                                        {p + 1}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t bg-white shrink-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-md text-gray-600">
                        <AlertCircle size={14} className="text-purple-500 shrink-0" />
                        <span>
                            <span className="font-bold text-purple-700">{selected.size}</span> sản phẩm được chọn
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-md text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 text-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                        >
                            {saving
                                ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</>
                                : <><Check size={14} /> Lưu {selected.size} sản phẩm</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}