'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Zap, Plus, Edit, Trash2, X, RefreshCw, Search,
    Clock, Package, ChevronLeft, ChevronRight,
    Calendar, Loader2, Save, DollarSign, CheckSquare2, BarChart2
} from 'lucide-react';
import {
    getFlashSalesPaged,
    getFlashSaleById,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale
} from '@/services/flashSaleService';
import { toast } from 'react-toastify';
import SkuPickerModal from '@/components/admin/SkuPickerModal';
import FlashSaleAnalyticsModal from '@/components/admin/FlashSaleAnalyticsModal';

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';
const fmtDt = (s) => s ? new Date(s).toLocaleString('vi-VN') : '—';

const toLocalInput = (iso) => iso ? iso.slice(0, 16) : '';
const fromLocalInput = (s) => s ? s + ':00' : null;

const deriveStatus = (sale) => {
    const now = new Date();
    const start = new Date(sale.startTime);
    const end = new Date(sale.endTime);
    const GRACE_MS = 30_000;
    if (now.getTime() + GRACE_MS < start.getTime()) return 'UPCOMING';
    if (now > end) return 'ENDED';
    return 'ACTIVE';
};

const STATUS_STYLES = {
    UPCOMING: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    ENDED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = {
    UPCOMING: 'Sắp diễn ra',
    ACTIVE: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
};

// ─── Flash Sale Form Modal ─────────────────────────────────────────
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

    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkQty, setBulkQty] = useState('');
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showPicker, setShowPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const alreadySelected = new Set(form.items.map(i => i.skuId));

    const handleAddSelectedSkus = (newSkusArray) => {
        const formattedItems = newSkusArray.map(sku => ({
            skuId: sku.skuId,
            skuCode: sku.skuCode,
            productName: sku.productName,
            variantName: sku.variantName,
            thumbnail: sku.thumbnail,
            originalPrice: sku.price,
            promotionalPrice: '',
            totalQuantity: '',
        }));
        setForm(prev => ({ ...prev, items: [...prev.items, ...formattedItems] }));
    };

    const removeItem = (idx) => {
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
        setSelectedRows(prev => {
            const next = new Set(prev);
            next.delete(idx);
            const reindexed = new Set();
            for (const r of next) { if (r < idx) reindexed.add(r); else if (r > idx) reindexed.add(r - 1); }
            return reindexed;
        });
    };

    const updateItem = (idx, field, value) => {
        setForm(prev => {
            const items = [...prev.items];
            items[idx] = { ...items[idx], [field]: value };
            return { ...prev, items };
        });
    };

    const applyBulk = () => {
        if (!bulkPrice && !bulkQty) {
            toast.warning('Nhập giá hoặc số lượng để áp dụng hàng loạt');
            return;
        }
        const targets = selectedRows.size > 0
            ? [...selectedRows]
            : form.items.map((_, i) => i);

        setForm(prev => {
            const items = [...prev.items];
            targets.forEach(idx => {
                if (bulkPrice) items[idx] = { ...items[idx], promotionalPrice: bulkPrice };
                if (bulkQty) items[idx] = { ...items[idx], totalQuantity: bulkQty };
            });
            return { ...prev, items };
        });
        toast.success(`Đã áp dụng cho ${targets.length} sản phẩm`);
    };

    const toggleRow = (idx) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const toggleAll = (checked) => {
        setSelectedRows(checked ? new Set(form.items.map((_, i) => i)) : new Set());
    };

    const allChecked = form.items.length > 0 && selectedRows.size === form.items.length;

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
                await updateFlashSale(sale.id, payload);
                toast.success('Cập nhật Flash Sale thành công!');
            } else {
                await createFlashSale(payload);
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-gray-50 shrink-0">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2 text-base sm:text-xl">
                            <Zap size={18} className="text-orange-500" />
                            {isEdit ? 'Cập nhật Flash Sale' : 'Tạo Flash Sale mới'}
                        </h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

                        {/* Campaign info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                    Tên chiến dịch *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="VD: Black Friday 2026"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm sm:text-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                    Bắt đầu *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.startTime}
                                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm sm:text-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                                    Kết thúc *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.endTime}
                                    min={form.startTime}
                                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm sm:text-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-3 bg-orange-50 px-4 py-3 rounded-xl border border-orange-100">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={form.isActive}
                                    onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                                    className="w-4 h-4 accent-orange-600 cursor-pointer"
                                />
                                <label htmlFor="isActive" className="text-sm sm:text-md font-bold text-orange-900 cursor-pointer">
                                    Kích hoạt chiến dịch ngay
                                </label>
                            </div>
                        </div>

                        {/* Bulk apply panel */}
                        {form.items.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                                <p className="text-xs sm:text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                                    <DollarSign size={14} /> Áp dụng giá / số lượng hàng loạt
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="number" min="0"
                                            placeholder="Giá KM hàng loạt (đ)"
                                            value={bulkPrice}
                                            onChange={e => setBulkPrice(e.target.value)}
                                            className="w-full border border-amber-300 rounded-lg pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="number" min="1"
                                            placeholder="Số lượng hàng loạt"
                                            value={bulkQty}
                                            onChange={e => setBulkQty(e.target.value)}
                                            className="w-full border border-amber-300 rounded-lg pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                        />
                                    </div>
                                    <button
                                        onClick={applyBulk}
                                        className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                        <CheckSquare2 size={14} />
                                        Áp dụng {selectedRows.size > 0 ? `(${selectedRows.size})` : 'tất cả'}
                                    </button>
                                </div>
                                <p className="text-sm text-amber-600 mt-2">
                                    Tick checkbox ở từng hàng để áp dụng cho sản phẩm cụ thể, hoặc để trống để áp cho tất cả.
                                </p>
                            </div>
                        )}

                        {/* SKU list */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                    Sản phẩm khuyến mãi ({form.items.length})
                                </label>
                                <button
                                    onClick={() => setShowPicker(true)}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                                >
                                    <Plus size={14} /> Thêm SKU
                                </button>
                            </div>

                            {form.items.length === 0 ? (
                                <div className="flex flex-col items-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                    <Package size={28} className="opacity-20 mb-2" />
                                    <p className="text-sm">Chưa có sản phẩm nào</p>
                                    <button
                                        onClick={() => setShowPicker(true)}
                                        className="mt-3 text-sm font-semibold text-orange-600 hover:underline cursor-pointer"
                                    >
                                        + Thêm sản phẩm
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            onChange={e => toggleAll(e.target.checked)}
                                            className="w-4 h-4 accent-orange-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500 font-medium">Chọn tất cả để áp giá hàng loạt</span>
                                    </div>

                                    {form.items.map((item, idx) => {
                                        const promoNum = Number(item.promotionalPrice) || 0;
                                        const origNum = Number(item.originalPrice) || 0;
                                        const savingPct = origNum > 0 && promoNum > 0 && promoNum < origNum
                                            ? Math.round((1 - promoNum / origNum) * 100)
                                            : null;
                                        const isSelected = selectedRows.has(idx);

                                        return (
                                            <div
                                                key={item.skuId}
                                                className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-xl transition-colors ${isSelected ? 'border-orange-300 bg-orange-50/40' : 'border-gray-200 bg-gray-50 hover:border-orange-200'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleRow(idx)}
                                                    className="w-4 h-4 accent-orange-500 cursor-pointer mt-1 shrink-0"
                                                />
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border bg-white overflow-hidden shrink-0 flex items-center justify-center">
                                                    {item.thumbnail
                                                        ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        : <Package size={14} className="text-gray-300" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-md font-semibold text-gray-900 truncate">{item.productName}</p>
                                                    <p className="text-xs text-gray-500 mb-2">{item.variantName} · Giá gốc: {fmt(item.originalPrice)}</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[13px] font-bold text-gray-500 uppercase mb-1">
                                                                Giá KM (đ) *
                                                            </label>
                                                            <input
                                                                type="number" min={0}
                                                                value={item.promotionalPrice}
                                                                onChange={e => updateItem(idx, 'promotionalPrice', e.target.value)}
                                                                placeholder="VD: 99000"
                                                                className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-md focus:outline-none focus:ring-1 focus:ring-orange-400"
                                                            />
                                                            {savingPct !== null && (
                                                                <p className="text-[13px] text-orange-600 font-bold mt-0.5">
                                                                    Giảm {savingPct}%
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-[13px] font-bold text-gray-500 uppercase mb-1">
                                                                Số lượng *
                                                            </label>
                                                            <input
                                                                type="number" min={1}
                                                                value={item.totalQuantity}
                                                                onChange={e => updateItem(idx, 'totalQuantity', e.target.value)}
                                                                placeholder="VD: 50"
                                                                className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-md focus:outline-none focus:ring-1 focus:ring-orange-400"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mt-0.5 shrink-0"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 sm:px-5 py-2.5 text-sm sm:text-md text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold cursor-pointer transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 sm:px-6 py-2.5 text-sm sm:text-md text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-xl font-bold cursor-pointer flex items-center gap-2 shadow-sm transition-colors"
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
                    alreadySelectedIds={alreadySelected}
                    onSave={handleAddSelectedSkus}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </>
    );
}

// ─── Main Flash Sale Admin Page ────────────────────────────────────
// FIX: analyticsSaleId state phải nằm TRONG component, không phải ngoài module
export default function FlashSalesPage() {
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [formTarget, setFormTarget] = useState(null);
    // FIX: Di chuyển hook từ ngoài module vào trong component
    const [analyticsSaleId, setAnalyticsSaleId] = useState(null);
    const debounce = useRef(null);

    const PAGE_SIZE = 10;

    const load = useCallback(async (pg = 0) => {
        setLoading(true);
        try {
            const res = await getFlashSalesPaged({ keyword, page: pg, size: PAGE_SIZE });
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
            await deleteFlashSale(id);
            toast.success('Đã xóa!');
            load(page);
        } catch { toast.error('Không thể xóa. Kiểm tra lại.'); }
    };

    const openEdit = async (id) => {
        try {
            const detail = await getFlashSaleById(id);
            setFormTarget(detail);
        } catch { toast.error('Không thể tải chi tiết'); }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap size={20} className="text-orange-500" /> Quản lý Flash Sale
                    </h1>
                    <p className="text-xs sm:text-md text-gray-500 mt-0.5">{data.totalElements} chiến dịch</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => load(page)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border bg-white border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium cursor-pointer transition-colors"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Làm mới</span>
                    </button>
                    <button
                        onClick={() => setFormTarget('new')}
                        className="flex items-center gap-2 bg-orange-500 text-white px-3 sm:px-4 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm cursor-pointer text-sm flex-1 sm:flex-none justify-center"
                    >
                        <Plus size={16} /> Tạo Flash Sale
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 sm:mb-5">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên chiến dịch..."
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <Loader2 size={28} className="animate-spin text-orange-400" />
                    </div>
                ) : data.content.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                        <Zap size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Chưa có Flash Sale nào.</p>
                        <button onClick={() => setFormTarget('new')}
                            className="mt-4 text-sm text-orange-500 hover:underline cursor-pointer font-semibold">
                            + Tạo Flash Sale đầu tiên
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile: card list */}
                        <div className="block sm:hidden divide-y divide-gray-100">
                            {data.content.map(sale => {
                                const status = deriveStatus(sale);
                                return (
                                    <div key={sale.id} className="p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm truncate">{sale.name}</p>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">#{sale.id}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {STATUS_LABELS[status]}
                                                </span>
                                                {!sale.isActive && <span className="text-xs text-gray-400">Đã tắt</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                            <span><Calendar size={11} className="inline mr-1" />{fmtDt(sale.startTime)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">{sale.items?.length || 0} SKUs</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => setAnalyticsSaleId(sale.id)}
                                                    className="p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer">
                                                    <BarChart2 size={13} />
                                                </button>
                                                <button onClick={() => openEdit(sale.id)}
                                                    className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer">
                                                    <Edit size={13} />
                                                </button>
                                                <button onClick={() => handleDelete(sale.id, sale.name)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: table — overflow-visible để dropdown không bị clip */}
                        <div className="hidden sm:block overflow-x-auto">
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
                                    {data.content.map(sale => {
                                        const status = deriveStatus(sale);
                                        return (
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
                                                    <span className="font-bold text-gray-700">{sale.items?.length || 0}</span>
                                                    <span className="text-gray-400 text-sm"> SKUs</span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
                                                            {STATUS_LABELS[status]}
                                                        </span>
                                                        {!sale.isActive && (
                                                            <span className="text-[14px] text-gray-400">Đã tắt</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => openEdit(sale.id)}
                                                            className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                                                            title="Chỉnh sửa">
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(sale.id, sale.name)}
                                                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                                                            title="Xóa">
                                                            <Trash2 size={14} />
                                                        </button>
                                                        <button onClick={() => setAnalyticsSaleId(sale.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                                                            title="Báo cáo">
                                                            <BarChart2 size={14} /> Báo cáo
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data.totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t bg-gray-50 text-sm flex-wrap gap-2">
                                <span className="text-gray-500 text-xs sm:text-sm">
                                    Trang {page + 1}/{data.totalPages} · {data.totalElements} chiến dịch
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                        className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 cursor-pointer hover:bg-gray-100">
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1}
                                        className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 cursor-pointer hover:bg-gray-100">
                                        <ChevronRight size={14} />
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

            {/* Analytics modal */}
            {analyticsSaleId && (
                <FlashSaleAnalyticsModal
                    saleId={analyticsSaleId}
                    onClose={() => setAnalyticsSaleId(null)}
                />
            )}
        </div>
    );
}