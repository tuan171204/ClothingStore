'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Zap, Plus, Edit, Trash2, X, RefreshCw, Search,
    Clock, Package, ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
    Calendar, Tag, Loader2, Save
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '@/lib/axios';

// ─── API helpers ─────────────────────────────────────────────────
const api = {
    listSales: (p) => axios.get('/flash-sales', { params: p }).then(r => r.data),
    getSale: (id) => axios.get(`/flash-sales/${id}`).then(r => r.data),
    createSale: (d) => axios.post('/flash-sales', d).then(r => r.data),
    updateSale: (id, d) => axios.put(`/flash-sales/${id}`, d).then(r => r.data),
    deleteSale: (id) => axios.delete(`/flash-sales/${id}`),
    searchSkus: (kw) => axios.get('/products/filter', { params: { keyword: kw, limit: 20, page: 0 } }).then(r => r.data),
};

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';
const fmtDt = (s) => s ? new Date(s).toLocaleString('vi-VN') : '—';
const toLocalInput = (iso) => iso ? iso.slice(0, 16) : '';
const fromLocalInput = (s) => s ? s + ':00' : null; // yyyy-MM-ddTHH:mm → yyyy-MM-ddTHH:mm:ss

const STATUS_STYLES = {
    UPCOMING: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    ENDED: 'bg-gray-100 text-gray-600',
};

// ─── SKU Picker Modal ─────────────────────────────────────────────
function SkuPickerModal({ onClose, onSelect, alreadySelected }) {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounce = useRef(null);

    const search = useCallback(async (kw) => {
        if (!kw.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const data = await api.searchSkus(kw);
            // Flatten products → skus for the picker
            const skus = [];
            (data.products || []).forEach(p => {
                (p.skus || []).forEach(s => {
                    if (s.isActive !== false) {
                        skus.push({
                            skuId: s.id,
                            skuCode: s.code,
                            productName: p.name,
                            variantName: s.skuName || s.code,
                            price: s.price,
                            thumbnail: s.imgUrl || p.thumbnail,
                        });
                    }
                });
            });
            setResults(skus);
        } catch { toast.error('Không tìm được SKU'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => search(keyword), 350);
        return () => clearTimeout(debounce.current);
    }, [keyword, search]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Package size={16} /> Chọn SKU
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-4 py-3 border-b shrink-0">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            autoFocus
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            placeholder="Tìm theo tên sản phẩm..."
                            className="w-full pl-9 pr-4 py-2 text-md border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-orange-400" /></div>
                    ) : results.length === 0 ? (
                        <p className="text-center text-md text-gray-400 py-8">
                            {keyword ? 'Không tìm thấy kết quả' : 'Nhập tên sản phẩm để tìm kiếm'}
                        </p>
                    ) : results.map(sku => {
                        const already = alreadySelected.has(sku.skuId);
                        return (
                            <button
                                key={sku.skuId}
                                disabled={already}
                                onClick={() => { onSelect(sku); onClose(); }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                                    ${already
                                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-gray-50 border overflow-hidden shrink-0 flex items-center justify-center">
                                    {sku.thumbnail
                                        ? <img src={sku.thumbnail} alt="" className="w-full h-full object-cover" />
                                        : <Package size={16} className="text-gray-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-md font-semibold text-gray-900 truncate">{sku.productName}</p>
                                    <p className="text-sm text-gray-500">{sku.variantName} · {fmt(sku.price)}</p>
                                </div>
                                {already && <span className="text-sm text-gray-400 shrink-0">Đã thêm</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Flash Sale Form Modal ────────────────────────────────────────
function FlashSaleFormModal({ sale, onClose, onSaved }) {
    const isEdit = !!sale;
    const [form, setForm] = useState({
        name: sale?.name || '',
        startTime: toLocalInput(sale?.startTime),
        endTime: toLocalInput(sale?.endTime),
        isActive: sale?.isActive ?? true,
        items: (sale?.items || []).map(i => ({
            skuId: i.skuId,
            skuCode: i.skuCode,
            productName: i.productName,
            variantName: i.variantName,
            thumbnail: i.thumbnailUrl,
            originalPrice: i.originalPrice,
            promotionalPrice: String(i.promotionalPrice),
            totalQuantity: String(i.totalQuantity),
        })),
    });
    const [showPicker, setShowPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const alreadySelected = new Set(form.items.map(i => i.skuId));

    const addSku = (sku) => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, {
                skuId: sku.skuId,
                skuCode: sku.skuCode,
                productName: sku.productName,
                variantName: sku.variantName,
                thumbnail: sku.thumbnail,
                originalPrice: sku.price,
                promotionalPrice: '',
                totalQuantity: '',
            }],
        }));
    };

    const removeItem = (idx) => {
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    };

    const updateItem = (idx, field, value) => {
        setForm(prev => {
            const items = [...prev.items];
            items[idx] = { ...items[idx], [field]: value };
            return { ...prev, items };
        });
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Vui lòng nhập tên chiến dịch'); return; }
        if (!form.startTime) { toast.error('Vui lòng chọn thời gian bắt đầu'); return; }
        if (!form.endTime) { toast.error('Vui lòng chọn thời gian kết thúc'); return; }
        if (form.items.length === 0) { toast.error('Vui lòng thêm ít nhất 1 sản phẩm'); return; }

        for (const item of form.items) {
            if (!item.promotionalPrice || Number(item.promotionalPrice) <= 0) {
                toast.error(`Nhập giá khuyến mãi cho: ${item.productName} - ${item.variantName}`);
                return;
            }
            if (!item.totalQuantity || Number(item.totalQuantity) <= 0) {
                toast.error(`Nhập số lượng cho: ${item.productName} - ${item.variantName}`);
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                startTime: fromLocalInput(form.startTime),
                endTime: fromLocalInput(form.endTime),
                isActive: form.isActive,
                items: form.items.map(i => ({
                    skuId: i.skuId,
                    promotionalPrice: Number(i.promotionalPrice),
                    totalQuantity: Number(i.totalQuantity),
                })),
            };

            if (isEdit) {
                await api.updateSale(sale.id, payload);
                toast.success('Cập nhật Flash Sale thành công!');
            } else {
                await api.createSale(payload);
                toast.success('Tạo Flash Sale thành công!');
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 shrink-0">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                            <Zap size={18} className="text-orange-500" />
                            {isEdit ? 'Cập nhật Flash Sale' : 'Tạo Flash Sale mới'}
                        </h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Campaign info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                    Tên chiến dịch *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="VD: Black Friday 2026"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                    Bắt đầu *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.startTime}
                                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                    Kết thúc *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.endTime}
                                    min={form.startTime}
                                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-3 bg-orange-50 px-4 py-3 rounded-xl border border-orange-100">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={form.isActive}
                                    onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                                    className="w-4 h-4 accent-orange-600 cursor-pointer"
                                />
                                <label htmlFor="isActive" className="text-md font-bold text-orange-900 cursor-pointer">
                                    Kích hoạt chiến dịch ngay
                                </label>
                            </div>
                        </div>

                        {/* SKU list */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                    Sản phẩm khuyến mãi ({form.items.length})
                                </label>
                                <button
                                    onClick={() => setShowPicker(true)}
                                    className="flex items-center gap-1.5 text-md font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                                >
                                    <Plus size={15} /> Thêm SKU
                                </button>
                            </div>

                            {form.items.length === 0 ? (
                                <div className="flex flex-col items-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                    <Package size={32} className="opacity-20 mb-2" />
                                    <p className="text-md">Chưa có sản phẩm nào</p>
                                    <button
                                        onClick={() => setShowPicker(true)}
                                        className="mt-3 text-md font-semibold text-orange-600 hover:underline cursor-pointer"
                                    >
                                        + Thêm sản phẩm
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {form.items.map((item, idx) => {
                                        const promoNum = Number(item.promotionalPrice) || 0;
                                        const origNum = Number(item.originalPrice) || 0;
                                        const saving = origNum > 0 && promoNum > 0 && promoNum < origNum
                                            ? Math.round((1 - promoNum / origNum) * 100)
                                            : null;

                                        return (
                                            <div key={item.skuId}
                                                className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50 hover:border-orange-200 transition-colors">
                                                {/* Thumbnail */}
                                                <div className="w-12 h-12 rounded-lg border bg-white overflow-hidden shrink-0 flex items-center justify-center">
                                                    {item.thumbnail
                                                        ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        : <Package size={16} className="text-gray-300" />}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-md font-semibold text-gray-900 truncate">{item.productName}</p>
                                                    <p className="text-sm text-gray-500 mb-2">{item.variantName} · Giá gốc: {fmt(item.originalPrice)}</p>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                                                Giá KM (đ) *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={item.promotionalPrice}
                                                                onChange={e => updateItem(idx, 'promotionalPrice', e.target.value)}
                                                                placeholder="VD: 99000"
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-md focus:outline-none focus:ring-1 focus:ring-orange-400"
                                                            />
                                                            {saving !== null && (
                                                                <p className="text-[10px] text-orange-600 font-bold mt-0.5">
                                                                    Giảm {saving}% so với giá gốc
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                                                Số lượng *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={item.totalQuantity}
                                                                onChange={e => updateItem(idx, 'totalQuantity', e.target.value)}
                                                                placeholder="VD: 50"
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-md focus:outline-none focus:ring-1 focus:ring-orange-400"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mt-0.5"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-md text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold cursor-pointer transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 text-md text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-xl font-bold cursor-pointer flex items-center gap-2 shadow-sm transition-colors"
                        >
                            {saving
                                ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</>
                                : <><Save size={14} /> {isEdit ? 'Lưu thay đổi' : 'Tạo chiến dịch'}</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {showPicker && (
                <SkuPickerModal
                    alreadySelected={alreadySelected}
                    onSelect={addSku}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </>
    );
}

// ─── Main Flash Sale Admin Page ───────────────────────────────────
export default function FlashSalesPage() {
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [formTarget, setFormTarget] = useState(null); // null = closed, 'new' = create, object = edit
    const debounce = useRef(null);

    const PAGE_SIZE = 10;

    const load = useCallback(async (pg = 0) => {
        setLoading(true);
        try {
            const res = await api.listSales({ keyword: keyword || undefined, page: pg, size: PAGE_SIZE });
            setData(res);
        } catch { toast.error('Không thể tải danh sách Flash Sale'); }
        finally { setLoading(false); }
    }, [keyword]);

    useEffect(() => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => { setPage(0); load(0); }, 350);
        return () => clearTimeout(debounce.current);
    }, [keyword]);

    useEffect(() => { load(page); }, [page]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Xóa Flash Sale "${name}"?`)) return;
        try {
            await api.deleteSale(id);
            toast.success('Đã xóa!');
            load(page);
        } catch { toast.error('Không thể xóa. Kiểm tra lại.'); }
    };

    const openEdit = async (id) => {
        try {
            const detail = await api.getSale(id);
            setFormTarget(detail);
        } catch { toast.error('Không thể tải chi tiết'); }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap size={22} className="text-orange-500" /> Quản lý Flash Sale
                    </h1>
                    <p className="text-md text-gray-500 mt-0.5">
                        {data.totalElements} chiến dịch
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => load(page)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white border-gray-300 text-gray-600 hover:bg-gray-50 text-md font-medium cursor-pointer transition-colors">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>
                    <button onClick={() => setFormTarget('new')}
                        className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm cursor-pointer text-md">
                        <Plus size={17} /> Tạo Flash Sale
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên chiến dịch..."
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-md border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <Loader2 size={28} className="animate-spin text-orange-400" />
                    </div>
                ) : data.content.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <Zap size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-md">Chưa có Flash Sale nào.</p>
                        <button onClick={() => setFormTarget('new')}
                            className="mt-4 text-md text-orange-500 hover:underline cursor-pointer font-semibold">
                            + Tạo Flash Sale đầu tiên
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-md">
                                <thead className="bg-gray-50 border-b text-sm font-bold text-gray-500 uppercase tracking-wide">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Tên chiến dịch</th>
                                        <th className="px-5 py-3 text-left">Thời gian</th>
                                        <th className="px-5 py-3 text-center">Sản phẩm</th>
                                        <th className="px-5 py-3 text-center">Trạng thái</th>
                                        <th className="px-5 py-3 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.content.map(sale => (
                                        <tr key={sale.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900">{sale.name}</div>
                                                <div className="text-sm text-gray-400 font-mono mt-0.5">#{sale.id}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Calendar size={11} className="text-gray-400" />
                                                    <span>{fmtDt(sale.startTime)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                                                    <Clock size={11} className="text-gray-400" />
                                                    <span>{fmtDt(sale.endTime)}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="font-bold text-gray-700">
                                                    {sale.items?.length || 0}
                                                </span>
                                                <span className="text-gray-400 text-sm"> SKUs</span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${STATUS_STYLES[sale.status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {sale.status === 'UPCOMING' ? 'Sắp diễn ra'
                                                            : sale.status === 'ACTIVE' ? 'Đang diễn ra'
                                                                : 'Đã kết thúc'}
                                                    </span>
                                                    {!sale.isActive && (
                                                        <span className="text-[10px] text-gray-400">Đã tắt</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEdit(sale.id)}
                                                        className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                                                        title="Sửa"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sale.id, sale.name)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data.totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 text-md">
                                <span className="text-gray-500">
                                    Trang {page + 1}/{data.totalPages} · {data.totalElements} chiến dịch
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                        className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 cursor-pointer hover:bg-gray-100">
                                        <ChevronLeft size={15} />
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1}
                                        className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 cursor-pointer hover:bg-gray-100">
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Form modal */}
            {formTarget && (
                <FlashSaleFormModal
                    sale={formTarget === 'new' ? null : formTarget}
                    onClose={() => setFormTarget(null)}
                    onSaved={() => load(page)}
                />
            )}
        </div>
    );
}