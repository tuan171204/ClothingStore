'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Package, AlertTriangle, DollarSign, Activity, Settings, Edit3, X,
    ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2, Search, ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
    getStockOnHand, getInventoryValuation, getLowStockItems,
    getStockMovements, adjustStock, updateLowStockThreshold, getInventoryBySkuId
} from '@/services/inventoryService';
import { getProductsWithFilter, getProductById } from '@/services/productService';
import Pagination from '@/components/admin/Pagination';

const PAGE_SIZE = 20;

const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(dateStr));
};

function ProductSearchDropdown({ onSelect, placeholder = 'Tìm sản phẩm theo tên hoặc mã SKU...' }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    const doSearch = useCallback(async (kw) => {
        if (!kw.trim()) { setResults([]); return; }
        setSearching(true);
        try {
            const res = await getProductsWithFilter({ keyword: kw, limit: 8, page: 0 });
            setResults(res?.products || res?.result?.products || []);
        } catch { setResults([]); }
        finally { setSearching(false); }
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setOpen(true);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 300);
    };

    const handleSelect = (product) => {
        setQuery(product.name);
        setOpen(false);
        onSelect(product);
    };

    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleChange}
                    onFocus={() => { if (query) setOpen(true); }}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
            </div>
            {open && (results.length > 0 || searching) && (
                <div className="absolute z-30 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {searching ? (
                        <div className="p-3 text-center text-gray-400 text-md">Đang tìm kiếm...</div>
                    ) : (
                        results.map(p => (
                            <button key={p.id} onMouseDown={() => handleSelect(p)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b last:border-b-0">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                                    {p.thumbnail
                                        ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                                        : <span className="flex items-center justify-center h-full text-sm text-gray-400">?</span>}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-md">{p.name}</p>
                                    <p className="text-sm text-gray-500">{p.brandName} · {p.categoryName}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function ProductSkuInventory({ product, onOpenDrawer }) {
    const [skuInventories, setSkuInventories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!product) return;
        setLoading(true);
        const activeSkus = product.skus?.filter(s => s.isActive !== false) || [];
        Promise.all(activeSkus.map(sku =>
            getInventoryBySkuId(sku.id)
                .then(res => res?.result || null)
                .catch(() => null)
        )).then(results => {
            setSkuInventories(results.filter(Boolean));
            setLoading(false);
        });
    }, [product]);

    if (!product) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base">{product.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{product.brandName} · {product.categoryName} · {product.skus?.length} phân loại</p>
                </div>
                <span className="text-xs sm:text-sm text-blue-600 font-semibold bg-blue-100 px-2 sm:px-3 py-1 rounded-full shrink-0 ml-2">
                    {skuInventories.filter(i => i.availableQuantity > 0).length} SKU còn hàng
                </span>
            </div>

            {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-400" size={24} /></div>
            ) : (
                /* Mobile: cards, Desktop: table */
                <>
                    {/* Mobile card list */}
                    <div className="block sm:hidden divide-y divide-gray-100">
                        {skuInventories.map(inv => (
                            <div key={inv.id} className={`p-3 ${inv.lowStock ? 'bg-red-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-800 text-sm">{inv.skuCode}</span>
                                    {inv.lowStock && <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full">⚠ Sắp hết</span>}
                                </div>
                                <div className="grid grid-cols-4 gap-1 text-center">
                                    {[
                                        { label: 'Thực tế', val: inv.physicalQuantity, cls: 'text-gray-600' },
                                        { label: 'Bán được', val: inv.availableQuantity, cls: inv.lowStock ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold' },
                                        { label: 'Giữ chỗ', val: inv.reservedQuantity || '—', cls: 'text-amber-600' },
                                        { label: 'Lỗi', val: inv.defectQuantity || '—', cls: 'text-red-500' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-gray-50 rounded-lg p-1.5">
                                            <p className={`text-sm font-bold ${s.cls}`}>{s.val}</p>
                                            <p className="text-xs text-gray-400">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => onOpenDrawer(inv)}
                                    className="mt-2 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50">
                                    Xem chi tiết
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-md text-left">
                            <thead className="bg-gray-50 text-sm text-gray-500 uppercase border-b">
                                <tr>
                                    <th className="p-3">Phân loại (SKU)</th>
                                    <th className="p-3">Mã SKU</th>
                                    <th className="p-3 text-center">Thực tế</th>
                                    <th className="p-3 text-center text-emerald-600">Có thể bán</th>
                                    <th className="p-3 text-center text-amber-600">Đang giữ</th>
                                    <th className="p-3 text-center text-red-500">Lỗi</th>
                                    <th className="p-3 text-center">Ngưỡng</th>
                                    <th className="p-3 text-center">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {skuInventories.map(inv => (
                                    <tr key={inv.id} className={`hover:bg-gray-50/60 transition-colors ${inv.lowStock ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-3 font-medium text-gray-800">{inv.skuCode}</td>
                                        <td className="p-3 text-gray-500 font-mono text-sm">{inv.skuCode}</td>
                                        <td className="p-3 text-center text-gray-600">{inv.physicalQuantity}</td>
                                        <td className={`p-3 text-center font-bold ${inv.lowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {inv.availableQuantity}
                                            {inv.lowStock && <span className="ml-1 text-[10px] text-red-500">⚠</span>}
                                        </td>
                                        <td className="p-3 text-center text-amber-600">{inv.reservedQuantity > 0 ? inv.reservedQuantity : '—'}</td>
                                        <td className="p-3 text-center text-red-500">{inv.defectQuantity > 0 ? inv.defectQuantity : '—'}</td>
                                        <td className="p-3 text-center text-gray-500">{inv.lowStockThreshold > 0 ? inv.lowStockThreshold : '—'}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => onOpenDrawer(inv)}
                                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer">
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default function InventoryDashboardPage() {
    const { adminUser } = useAdminAuth();

    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState(null);
    const [valuation, setValuation] = useState(null);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [summaryPage, setSummaryPage] = useState(0);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(false);

    const [selectedSku, setSelectedSku] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('movements');
    const [movements, setMovements] = useState([]);
    const [loadingDrawer, setLoadingDrawer] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ quantityChange: '', reason: '' });
    const [thresholdForm, setThresholdForm] = useState({ threshold: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = adminUser?.role?.name === 'ADMIN' || adminUser?.role?.name === 'SUPER_ADMIN';

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [stockRes, lowStockRes] = await Promise.all([
                getStockOnHand(),
                getLowStockItems(),
            ]);
            setStockData(stockRes?.result);
            setLowStockCount(lowStockRes?.result?.length || 0);
            if (isAdmin) {
                const valRes = await getInventoryValuation();
                setValuation(valRes?.result?.totalValue || 0);
            }
        } catch { toast.error('Lỗi tải dữ liệu kho!'); }
        finally { setLoading(false); }
    }, [isAdmin]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    const handleSelectProduct = async (product) => {
        setLoadingProduct(true);
        try {
            const res = await getProductById(product.id);
            setSelectedProduct(res?.result || res || product);
        } catch { setSelectedProduct(product); }
        finally { setLoadingProduct(false); }
    };

    const openDrawer = async (item) => {
        setSelectedSku(item);
        setThresholdForm({ threshold: item.lowStockThreshold || 0 });
        setAdjustForm({ quantityChange: '', reason: '' });
        setIsDrawerOpen(true);
        setActiveTab('movements');
        setLoadingDrawer(true);
        const res = await getStockMovements(item.skuId);
        setMovements(res?.result || []);
        setLoadingDrawer(false);
    };

    const handleAdjustStock = async (e) => {
        e.preventDefault();
        if (!adjustForm.quantityChange || !adjustForm.reason) { toast.warning('Vui lòng nhập đủ thông tin!'); return; }
        setIsSubmitting(true);
        try {
            await adjustStock({ skuId: selectedSku.skuId, quantityChange: parseInt(adjustForm.quantityChange), reason: adjustForm.reason });
            toast.success('Điều chỉnh kho thành công!');
            setAdjustForm({ quantityChange: '', reason: '' });
            const res = await getStockMovements(selectedSku.skuId);
            setMovements(res?.result || []);
            fetchDashboardData();
            if (selectedProduct) {
                const updated = await getProductById(selectedProduct.id);
                setSelectedProduct(updated?.result || updated);
            }
        } catch (error) { toast.error(error.message || 'Lỗi điều chỉnh kho!'); }
        finally { setIsSubmitting(false); }
    };

    const handleUpdateThreshold = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateLowStockThreshold(selectedSku.skuId, { threshold: parseInt(thresholdForm.threshold) });
            toast.success('Cập nhật ngưỡng cảnh báo thành công!');
            fetchDashboardData();
        } catch { toast.error('Lỗi cập nhật!'); }
        finally { setIsSubmitting(false); }
    };

    const allItems = stockData?.items || [];
    const pageItems = allItems.slice(summaryPage * PAGE_SIZE, (summaryPage + 1) * PAGE_SIZE);

    return (
        <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="text-blue-600" /> Quản lý Tồn Kho
            </h1>

            {/* KPI WIDGETS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-5 flex items-center justify-between">
                    <div><p className="text-xs sm:text-md text-gray-500 mb-1">Tổng SKUs</p><p className="text-2xl sm:text-3xl font-bold text-gray-800">{stockData?.totalSkus || 0}</p></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0"><Package size={18} /></div>
                </div>
                <div className={`bg-white rounded-xl shadow-sm border p-3 sm:p-5 flex items-center justify-between ${lowStockCount > 0 ? 'border-red-100' : ''}`}>
                    <div><p className="text-xs sm:text-md text-red-500 mb-1 font-medium">Sắp hết hàng</p><p className="text-2xl sm:text-3xl font-bold text-red-600">{lowStockCount} <span className="text-lg sm:text-xl font-normal">SKUs</span></p></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0"><AlertTriangle size={18} /></div>
                </div>
                {isAdmin && (
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-3 sm:p-5 flex items-center justify-between col-span-2 sm:col-span-1">
                        <div><p className="text-xs sm:text-md text-emerald-600 mb-1 font-medium">Tổng Giá Trị Kho</p>
                            <p className="text-base sm:text-2xl font-bold text-emerald-700">{valuation !== null ? formatCurrency(valuation) : '...'}</p></div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0"><DollarSign size={18} /></div>
                    </div>
                )}
            </div>

            {/* PRODUCT SEARCH SECTION */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-sm sm:text-base mb-0.5">Tra cứu tồn kho theo sản phẩm</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Tìm sản phẩm để xem chi tiết từng biến thể (SKU)</p>
                </div>
                <div className="p-3 sm:p-5">
                    <ProductSearchDropdown onSelect={handleSelectProduct} />
                    {loadingProduct && (
                        <div className="mt-6 flex justify-center py-8">
                            <Loader2 className="animate-spin text-blue-400" size={28} />
                        </div>
                    )}
                    {!loadingProduct && selectedProduct && (
                        <ProductSkuInventory product={selectedProduct} onOpenDrawer={openDrawer} />
                    )}
                    {!loadingProduct && !selectedProduct && (
                        <div className="mt-6 sm:mt-8 text-center text-gray-400 py-6 sm:py-8 border-2 border-dashed border-gray-200 rounded-xl">
                            <Search size={28} className="mx-auto mb-3 text-gray-200" />
                            <p className="font-medium text-sm">Nhập tên sản phẩm hoặc mã SKU để tra cứu</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FULL STOCK TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-5 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-gray-800 text-sm sm:text-base">Tổng quan tồn kho</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{allItems.length} SKUs</p>
                    </div>
                    <button onClick={fetchDashboardData} className="text-sm text-gray-600 flex items-center gap-1 hover:text-blue-600">
                        <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Làm mới</span>
                    </button>
                </div>

                {/* Mobile: compact rows */}
                <div className="block sm:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Đang tải...</div>
                    ) : pageItems.map((item) => (
                        <div key={item.id} onClick={() => openDrawer(item)}
                            className={`flex items-center gap-3 p-3 hover:bg-blue-50/50 cursor-pointer ${item.lowStock ? 'bg-red-50/20' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm truncate">
                                    {item.productName}
                                    {item.lowStock && <span className="ml-2 text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">Sắp hết</span>}
                                </p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{item.skuCode}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`font-bold text-sm ${item.lowStock ? 'text-red-600' : 'text-emerald-600'}`}>{item.availableQuantity}</p>
                                <p className="text-xs text-gray-400">có thể bán</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-md text-left">
                        <thead className="bg-gray-50 text-sm text-gray-500 uppercase border-b">
                            <tr>
                                <th className="p-4">Sản Phẩm</th>
                                <th className="p-4">Mã SKU</th>
                                <th className="p-4 text-center">Thực tế</th>
                                <th className="p-4 text-center">Có thể bán</th>
                                <th className="p-4 text-center text-amber-600">Giữ chỗ</th>
                                <th className="p-4 text-center text-red-500">Lỗi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Đang tải...</td></tr>
                            ) : pageItems.map((item) => (
                                <tr key={item.id} onClick={() => openDrawer(item)}
                                    className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${item.lowStock ? 'bg-red-50/20' : ''}`}>
                                    <td className="p-4 font-medium text-gray-800">
                                        {item.productName}
                                        {item.lowStock && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">Sắp hết</span>}
                                    </td>
                                    <td className="p-4 text-gray-500 font-mono text-sm">{item.skuCode}</td>
                                    <td className="p-4 text-center text-gray-600">{item.physicalQuantity}</td>
                                    <td className={`p-4 text-center font-bold ${item.lowStock ? 'text-red-600' : 'text-emerald-600'}`}>{item.availableQuantity}</td>
                                    <td className="p-4 text-center text-amber-600">{item.reservedQuantity > 0 ? item.reservedQuantity : '—'}</td>
                                    <td className="p-4 text-center text-red-500">{item.defectQuantity > 0 ? item.defectQuantity : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={summaryPage}
                    totalPages={Math.ceil(allItems.length / PAGE_SIZE)}
                    totalElements={allItems.length}
                    size={PAGE_SIZE}
                    onPageChange={setSummaryPage}
                    loading={loading}
                />
            </div>

            {/* SIDE DRAWER — full screen on mobile */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
                    <div className="relative w-full sm:max-w-2xl bg-white h-full shadow-2xl flex flex-col">
                        <div className="p-4 sm:p-6 border-b bg-gray-50 flex justify-between items-start">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Chi tiết tồn kho</h2>
                                <p className="text-xs sm:text-md text-gray-500 mt-1">
                                    <span className="font-semibold text-gray-700">{selectedSku?.productName}</span>
                                    {' '}· <span className="font-mono text-sm">{selectedSku?.skuCode}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-2 rounded-full shrink-0">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 divide-x border-b text-center">
                            {[
                                { label: 'Thực tế', value: selectedSku?.physicalQuantity, color: 'text-gray-700' },
                                { label: 'Bán được', value: selectedSku?.availableQuantity, color: selectedSku?.lowStock ? 'text-red-600' : 'text-emerald-600' },
                                { label: 'Giữ chỗ', value: selectedSku?.reservedQuantity, color: 'text-amber-600' },
                                { label: 'Lỗi', value: selectedSku?.defectQuantity, color: 'text-red-500' },
                            ].map(stat => (
                                <div key={stat.label} className="p-2 sm:p-3">
                                    <div className={`text-xl sm:text-2xl font-black ${stat.color}`}>{stat.value ?? '—'}</div>
                                    <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex border-b px-3 sm:px-6 overflow-x-auto">
                            {[
                                { id: 'movements', label: 'Lịch sử', icon: Activity },
                                { id: 'adjust', label: 'Điều chỉnh', icon: Edit3 },
                                ...(isAdmin ? [{ id: 'settings', label: 'Ngưỡng', icon: Settings }] : []),
                            ].map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 sm:px-4 py-3 text-xs sm:text-md font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap
                                            ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                        <Icon size={14} /> {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {activeTab === 'movements' && (
                                loadingDrawer ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
                                ) : movements.length === 0 ? (
                                    <p className="text-center text-gray-400 mt-10">Chưa có lịch sử biến động.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {movements.map(mov => {
                                            const isAdd = mov.afterQuantity > mov.beforeQuantity;
                                            return (
                                                <div key={mov.id} className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border">
                                                    <div className={`mt-0.5 p-2 rounded-full shrink-0 ${isAdd ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                                        {isAdd ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <span className="font-bold text-sm text-gray-800">{mov.movementType}</span>
                                                            <span className={`font-bold text-sm ${isAdd ? 'text-green-600' : 'text-red-500'}`}>
                                                                {isAdd ? '+' : '-'}{mov.quantity}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(mov.createdAt)}</p>
                                                        {mov.note && <p className="text-sm text-gray-700 mt-1 truncate">{mov.note}</p>}
                                                        <div className="flex justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                                                            <span>Trước: {mov.beforeQuantity}</span>
                                                            <span className="font-semibold text-gray-600">Sau: {mov.afterQuantity}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            )}

                            {activeTab === 'adjust' && (
                                <div className="max-w-md">
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-md text-amber-800 mb-5">
                                        Dùng để bù trừ số lượng sau khi kiểm kê. Mọi thao tác đều được lưu lịch sử.
                                    </div>
                                    <form onSubmit={handleAdjustStock} className="space-y-4">
                                        <div>
                                            <label className="block text-md font-semibold text-gray-700 mb-1.5">Số lượng điều chỉnh (+/-)</label>
                                            <input type="number" required placeholder="VD: 5 để cộng, -3 để trừ"
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:ring-2 focus:ring-amber-400 outline-none"
                                                value={adjustForm.quantityChange}
                                                onChange={e => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-md font-semibold text-gray-700 mb-1.5">Lý do *</label>
                                            <textarea required rows="3" placeholder="VD: Hàng bị ẩm mốc sau kiểm kho..."
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:ring-2 focus:ring-amber-400 outline-none resize-none"
                                                value={adjustForm.reason}
                                                onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
                                        </div>
                                        <button type="submit" disabled={isSubmitting}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-60">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Xác nhận điều chỉnh'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'settings' && isAdmin && (
                                <div className="max-w-md">
                                    <h3 className="text-base font-bold text-gray-800 mb-2">Ngưỡng cảnh báo tồn kho thấp</h3>
                                    <p className="text-md text-gray-500 mb-5">Hệ thống sẽ đánh dấu đỏ SKU này khi tồn kho khả dụng xuống dưới mức này.</p>
                                    <form onSubmit={handleUpdateThreshold} className="space-y-4">
                                        <div>
                                            <label className="block text-md font-semibold text-gray-700 mb-1.5">Ngưỡng tối thiểu</label>
                                            <input type="number" min="0" required
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md font-bold text-xl focus:ring-2 focus:ring-gray-800 outline-none"
                                                value={thresholdForm.threshold}
                                                onChange={e => setThresholdForm({ threshold: e.target.value })} />
                                            <p className="text-sm text-gray-400 mt-1.5">Đặt 0 để tắt cảnh báo.</p>
                                        </div>
                                        <button type="submit" disabled={isSubmitting}
                                            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-60">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Lưu cài đặt'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}