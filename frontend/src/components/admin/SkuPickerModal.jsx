'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Search, Check, Loader2, Package, Tag, FolderTree, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'react-toastify';

const formatCurrency = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';

async function fetchProducts({ keyword, categoryId, brandId, page, size }) {
    const params = { page, limit: size };
    if (keyword?.trim()) params.keyword = keyword.trim();
    if (categoryId) params.categoryId = categoryId;
    if (brandId) params.brandId = brandId;
    const res = await axios.get('/products/filter', { params });
    return res.data;
}

export default function SkuPickerModal({ alreadySelectedIds, onClose, onSave }) {
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 8;

    const [skus, setSkus] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingFilters, setLoadingFilters] = useState(true);

    // Dùng Map để lưu full object SKU thay vì chỉ lưu ID
    const [selectedSkus, setSelectedSkus] = useState(new Map());

    const debounceRef = useRef(null);

    useEffect(() => {
        Promise.all([
            axios.get('/categories').then(r => r.data),
            axios.get('/brands').then(r => r.data)
        ]).then(([cats, brds]) => {
            setCategories(cats || []);
            setBrands(brds || []);
        }).finally(() => setLoadingFilters(false));
    }, []);

    const loadSkus = useCallback(async (pg = page) => {
        setLoading(true);
        try {
            const data = await fetchProducts({ keyword, categoryId, brandId, page: pg, size: PAGE_SIZE });

            // 🔥 FLATTEN LOGIC: Trích xuất toàn bộ SKU từ các Product trả về
            const flatSkus = [];
            (data.products || []).forEach(p => {
                (p.skus || []).forEach(s => {
                    if (s.isActive !== false) {
                        flatSkus.push({
                            skuId: s.id,
                            skuCode: s.code,
                            productName: p.name,
                            variantName: s.skuName || (s.values ? s.values.map(v => v.optionValue.value).join(' - ') : s.code),
                            price: s.price,
                            thumbnail: s.imgUrl || p.thumbnail,
                            brandName: p.brandName,
                        });
                    }
                });
            });

            setSkus(flatSkus);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0); // Đây là tổng Product, không phải tổng SKU
        } catch {
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [keyword, categoryId, brandId, page]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadSkus(0), keyword ? 350 : 0);
        return () => clearTimeout(debounceRef.current);
    }, [keyword, categoryId, brandId]);

    useEffect(() => { loadSkus(page); }, [page]);

    const toggle = (sku) => {
        if (alreadySelectedIds.has(sku.skuId)) return; // Không cho chọn lại hàng đã có

        setSelectedSkus(prev => {
            const next = new Map(prev);
            if (next.has(sku.skuId)) next.delete(sku.skuId);
            else next.set(sku.skuId, sku);
            return next;
        });
    };

    const handleSave = () => {
        onSave(Array.from(selectedSkus.values()));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* ── Header ── */}
                <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Chọn biến thể sản phẩm (SKU)</h2>
                        <p className="text-lg text-gray-500 mt-0.5">Lọc và chọn nhiều SKU cùng lúc để đưa vào chiến dịch Flash Sale.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* ── Filter ── */}
                <div className="px-6 py-3 border-b bg-white shrink-0 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Tìm theo tên sản phẩm..." value={keyword}
                            onChange={e => { setKeyword(e.target.value); setPage(0); }}
                            className="w-full pl-9 pr-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(0); }} disabled={loadingFilters}
                        className="px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value=""><FolderTree size={12} className="inline mr-1" /> Tất cả danh mục</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={brandId} onChange={e => { setBrandId(e.target.value); setPage(0); }} disabled={loadingFilters}
                        className="px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value=""><Tag size={12} className="inline mr-1" /> Tất cả thương hiệu</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                {/* ── List ── */}
                <div className="flex-1 overflow-y-auto px-6 py-3">
                    {loading ? (
                        <div className="flex justify-center items-center py-16"><Loader2 size={26} className="animate-spin text-orange-400" /></div>
                    ) : skus.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-gray-400">
                            <Package size={40} className="opacity-20 mb-3" />
                            <p className="text-lg">Không tìm thấy biến thể nào</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {skus.map(sku => {
                                const isChosen = selectedSkus.has(sku.skuId);
                                const isAlreadyInForm = alreadySelectedIds.has(sku.skuId);

                                return (
                                    <label key={sku.skuId}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all select-none
                                            ${isAlreadyInForm ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                : isChosen ? 'border-orange-400 bg-orange-50/60 cursor-pointer'
                                                    : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50 cursor-pointer'}`}>
                                        <input type="checkbox" checked={isChosen || isAlreadyInForm} disabled={isAlreadyInForm}
                                            onChange={() => toggle(sku)} className="w-4 h-4 rounded accent-orange-500 shrink-0 cursor-pointer" />

                                        <div className="w-12 h-12 rounded-lg border bg-white flex items-center justify-center shrink-0 overflow-hidden">
                                            {sku.thumbnail ? <img src={sku.thumbnail} className="w-full h-full object-cover" /> : <Package size={18} className="text-gray-300" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-semibold text-gray-900 truncate">{sku.productName}</p>
                                            <p className="text-md text-gray-500 truncate">{sku.variantName} {sku.brandName ? `· ${sku.brandName}` : ''}</p>
                                            <p className="text-md font-bold text-orange-600 mt-0.5">{formatCurrency(sku.price)}</p>
                                        </div>
                                        {isAlreadyInForm && <span className="text-md text-gray-400">Đã chọn</span>}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="px-6 py-2 border-t bg-gray-50 shrink-0 flex items-center justify-between">
                        <span className="text-md text-gray-500">Trang {page + 1}/{totalPages}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 border rounded-lg hover:bg-gray-100"><ChevronLeft size={15} /></button>
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 border rounded-lg hover:bg-gray-100"><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t flex justify-between gap-3 bg-white">
                    <div className="flex items-center gap-2 text-lg text-gray-600">
                        <AlertCircle size={14} className="text-orange-500 shrink-0" />
                        <span>Đang chọn <span className="font-bold text-orange-600">{selectedSkus.size}</span> biến thể mới</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 rounded-xl font-semibold">Hủy</button>
                        <button onClick={handleSave} disabled={selectedSkus.size === 0} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 rounded-xl font-bold flex items-center gap-2">
                            <Check size={16} /> Thêm vào chiến dịch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}