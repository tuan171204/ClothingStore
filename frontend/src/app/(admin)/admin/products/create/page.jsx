'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Info, X, ChevronDown, ChevronUp, Upload, Loader2, ImageIcon, Link2 } from 'lucide-react';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { createProduct } from '@/services/productService';
import { uploadImage } from '@/services/uploadService';
import ImageUpload from '@/components/common/ImageUpload';

// ─────────────────────────────────────────────────────────────
// GroupImageUploader: upload ảnh cho một option value cụ thể
// (VD: upload 1 ảnh cho Màu Đỏ → áp dụng cho tất cả SKU có Màu=Đỏ)
// ─────────────────────────────────────────────────────────────
function GroupImageUploader({ groupLabel, currentUrl, onUpload }) {
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Chọn file ảnh!');
        if (file.size > 5 * 1024 * 1024) return toast.error('File quá lớn (max 5MB)!');
        setUploading(true);
        try {
            const url = await uploadImage(file);
            onUpload(url);
        } catch {
            toast.error('Upload thất bại!');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors group">
            {/* Thumbnail preview */}
            <div className="w-14 h-14 rounded-lg border border-gray-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                {currentUrl
                    ? <img src={currentUrl} alt={groupLabel} className="w-full h-full object-cover" />
                    : <ImageIcon size={20} className="text-gray-300" />
                }
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 truncate">{groupLabel}</p>
                {currentUrl
                    ? <p className="text-xs text-green-600 mt-0.5 truncate flex items-center gap-1">
                        <Link2 size={10} /> Đã có ảnh
                    </p>
                    : <p className="text-xs text-gray-400 mt-0.5">Chưa có ảnh</p>
                }
            </div>

            {/* Upload / Remove */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {currentUrl && (
                    <button
                        type="button"
                        onClick={() => onUpload('')}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded border border-red-200 hover:border-red-400 transition-colors"
                    >
                        Xóa
                    </button>
                )}
                <label className={`cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
                    ${uploading
                        ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100'
                    }`}>
                    {uploading
                        ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Đang upload...</span>
                        : <span className="flex items-center gap-1"><Upload size={12} /> {currentUrl ? 'Đổi ảnh' : 'Upload'}</span>
                    }
                    <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={handleFile} />
                </label>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Detect which option is "image-grouping" (màu sắc, color…)
// ─────────────────────────────────────────────────────────────
const IMAGE_OPTION_NAMES = ['màu sắc', 'màu', 'color', 'colour'];
function isImageOption(name) {
    return IMAGE_OPTION_NAMES.includes(name?.toLowerCase().trim());
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function CreateProductPage() {
    const router = useRouter();
    const SUGGESTED_OPTION_NAMES = ['Màu sắc', 'Kích thước', 'Chất liệu', 'Kiểu dáng'];

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [product, setProduct] = useState({
        name: '', description: '', categoryId: '', brandId: '', thumbnail: '', basePrice: '',
    });
    const [options, setOptions] = useState([]);
    const [skus, setSkus] = useState([]);
    const [bulkProfitMargin, setBulkProfitMargin] = useState('');

    // groupImages: { [optionName]: { [value]: url } }
    // Ví dụ: { "Màu sắc": { "Đỏ": "https://...", "Xanh": "https://..." } }
    const [groupImages, setGroupImages] = useState({});

    const [showSkuTable, setShowSkuTable] = useState(true);

    useEffect(() => {
        Promise.all([getCategories(), getBrands()]).then(([cats, brs]) => {
            setCategories(cats);
            setBrands(brs);
        }).catch(() => toast.error('Lỗi kết nối dữ liệu'));
    }, []);

    // ── Option helpers ────────────────────────────────────────
    const addOption = () => setOptions([...options, { name: 'Màu sắc', values: [], inputVal: '' }]);

    const updateOptionName = (idx, name) => {
        const next = [...options];
        next[idx].name = name;
        setOptions(next);
        regenerateSkus(next);
    };

    const addOptionValue = (idx, val) => {
        if (!val?.trim()) return;
        const next = [...options];
        if (!next[idx].values.includes(val.trim())) {
            next[idx].values.push(val.trim());
            next[idx].inputVal = '';
            setOptions(next);
            regenerateSkus(next);
        }
    };

    const removeOptionValue = (optIdx, valIdx) => {
        const next = [...options];
        next[optIdx].values.splice(valIdx, 1);
        setOptions(next);
        regenerateSkus(next);
    };

    const removeOption = (idx) => {
        const next = [...options];
        next.splice(idx, 1);
        setOptions(next);
        regenerateSkus(next);
    };

    // ── SKU generation ────────────────────────────────────────
    const regenerateSkus = useCallback((currentOptions) => {
        const valid = currentOptions.filter(o => o.values.length > 0);
        if (!valid.length) { setSkus([]); return; }

        const cartesian = (arrs) =>
            arrs.reduce((acc, arr) => acc.flatMap(d => arr.map(e => [...d, e])), [[]]);

        const combos = cartesian(valid.map(o => o.values));

        setSkus(prev => combos.map((combo) => {
            const name = combo.join(' - ');
            const optionValues = combo.map((val, i) => ({ optionName: valid[i].name, value: val }));
            const existing = prev.find(s => s.name === name);
            return {
                code: existing?.code || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                name,
                stock: existing?.stock || 0,
                profitMargin: existing?.profitMargin || 0,
                optionValues,
                // imgUrl is derived from groupImages at submit time — no per-SKU override here
            };
        }));
    }, []);

    // ── Group image helpers ───────────────────────────────────
    const setGroupImage = (optionName, value, url) => {
        setGroupImages(prev => ({
            ...prev,
            [optionName]: { ...(prev[optionName] || {}), [value]: url },
        }));
    };

    // Resolve imgUrl for a SKU from groupImages
    const resolveSkuImage = (sku) => {
        for (const ov of sku.optionValues) {
            const url = groupImages[ov.optionName]?.[ov.value];
            if (url) return url;
        }
        return '';
    };

    // Detect which options should show image grouping
    const imageOptions = options.filter(o => isImageOption(o.name) && o.values.length > 0);
    const nonImageOptions = options.filter(o => !isImageOption(o.name));

    // ── Bulk margin ───────────────────────────────────────────
    const applyBulkMargin = () => {
        const m = parseFloat(bulkProfitMargin);
        if (isNaN(m) || m < 0) return toast.warning('Nhập tỷ lệ hợp lệ (≥ 0)');
        setSkus(prev => prev.map(s => ({ ...s, profitMargin: m })));
        toast.success(`Áp dụng lợi nhuận ${m}% cho tất cả biến thể`);
    };

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!product.name) return toast.warning('Vui lòng nhập tên sản phẩm!');
        if (!product.categoryId) return toast.warning('Vui lòng chọn danh mục!');
        if (!product.brandId) return toast.warning('Vui lòng chọn thương hiệu!');
        if (options.length === 0) return toast.warning('Vui lòng thêm ít nhất 1 nhóm phân loại!');
        if (skus.length === 0) return toast.warning('Vui lòng tạo các biến thể (SKU)!');

        const id = toast.loading('Đang tạo sản phẩm...');
        try {
            const payload = {
                ...product,
                basePrice: 0,
                options: options.map(o => ({
                    name: o.name,
                    values: o.values.map(v => ({ value: v })),
                })),
                skus: skus.map(s => ({
                    code: s.code,
                    price: 0,
                    importPrice: 0,
                    stockQuantity: s.stock,
                    profitMargin: s.profitMargin || 0,
                    imgUrl: resolveSkuImage(s),
                    optionValues: s.optionValues,
                })),
            };

            await createProduct(payload);
            toast.update(id, { render: '🎉 Tạo sản phẩm thành công!', type: 'success', isLoading: false, autoClose: 3000 });
            setTimeout(() => router.push('/admin/products'), 600);
        } catch (err) {
            toast.update(id, {
                render: `Thất bại: ${err.response?.data?.message || 'Lỗi khi tạo sản phẩm'}`,
                type: 'error', isLoading: false, autoClose: 4000,
            });
        }
    };

    return (
        <div className="p-4 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
                <p className="text-sm text-gray-500 mt-1">Tạo sản phẩm, nhóm phân loại và cấu hình ảnh theo nhóm màu sắc.</p>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
                <div>
                    <strong>Quy trình:</strong> Tạo sản phẩm → Thêm phân loại (màu, size) → Upload ảnh theo nhóm màu →
                    Hệ thống tự áp dụng ảnh cho các SKU cùng màu. Giá nhập/bán được cập nhật khi tạo phiếu nhập kho.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ─── LEFT COLUMN ──────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Basic info */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 text-base mb-4 pb-3 border-b border-gray-100">
                            Thông tin cơ bản
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tên sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    value={product.name}
                                    onChange={e => setProduct({ ...product, name: e.target.value })}
                                    placeholder="VD: Áo Thun Polo Premium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả chi tiết</label>
                                <textarea
                                    rows={3}
                                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors"
                                    value={product.description}
                                    onChange={e => setProduct({ ...product, description: e.target.value })}
                                    placeholder="Mô tả ngắn về sản phẩm..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Options & SKU matrix */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800 text-base">Phân loại hàng</h2>
                            <button
                                type="button"
                                onClick={addOption}
                                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus size={16} /> Thêm nhóm
                            </button>
                        </div>

                        {options.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                <Plus size={28} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Nhấn "Thêm nhóm" để bắt đầu tạo phân loại</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {options.map((opt, optIdx) => (
                                <div key={optIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        {/* Option name select */}
                                        <select
                                            className="border border-gray-300 px-3 py-2 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none w-48"
                                            value={opt.name}
                                            onChange={e => updateOptionName(optIdx, e.target.value)}
                                        >
                                            {SUGGESTED_OPTION_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <span className="text-xs text-gray-400 flex-1">
                                            {isImageOption(opt.name) && (
                                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                                    <ImageIcon size={10} /> Nhóm này sẽ dùng để nhóm ảnh
                                                </span>
                                            )}
                                        </span>
                                        <button type="button" onClick={() => removeOption(optIdx)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Value input */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                            placeholder={`VD: ${opt.name === 'Màu sắc' ? 'Đỏ, Xanh, Trắng...' : 'S, M, L, XL...'} (Enter để thêm)`}
                                            value={opt.inputVal || ''}
                                            onChange={e => {
                                                const next = [...options];
                                                next[optIdx].inputVal = e.target.value;
                                                setOptions(next);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addOptionValue(optIdx, opt.inputVal);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addOptionValue(optIdx, opt.inputVal)}
                                            className="px-3 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-black transition-colors font-medium"
                                        >
                                            Thêm
                                        </button>
                                    </div>

                                    {/* Value chips */}
                                    {opt.values.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {opt.values.map((val, valIdx) => (
                                                <span key={valIdx} className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-full shadow-sm">
                                                    {val}
                                                    <button type="button" onClick={() => removeOptionValue(optIdx, valIdx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── GROUP IMAGE UPLOAD ─────────────────── */}
                    {imageOptions.length > 0 && (
                        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <ImageIcon size={18} className="text-amber-500" />
                                <h2 className="font-bold text-gray-800 text-base">Ảnh theo nhóm màu sắc</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Upload <strong>1 ảnh cho mỗi màu</strong>. Hệ thống tự áp dụng ảnh đó cho tất cả SKU có cùng màu (VD: Đỏ-S, Đỏ-M, Đỏ-L cùng dùng ảnh Đỏ).
                            </p>

                            {imageOptions.map(opt => (
                                <div key={opt.name} className="mb-4 last:mb-0">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{opt.name}</p>
                                    <div className="space-y-2">
                                        {opt.values.map(val => (
                                            <GroupImageUploader
                                                key={val}
                                                groupLabel={val}
                                                currentUrl={groupImages[opt.name]?.[val] || ''}
                                                onUpload={url => setGroupImage(opt.name, val, url)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Non-image options also can have group images if desired */}
                    {nonImageOptions.filter(o => o.values.length > 0 && !isImageOption(o.name)).length > 0 && imageOptions.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <ImageIcon size={18} className="text-gray-400" />
                                <h2 className="font-bold text-gray-800 text-base">Ảnh theo nhóm phân loại</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Thêm nhóm <strong>"Màu sắc"</strong> để kích hoạt upload ảnh theo màu tự động. Hoặc upload ảnh đại diện chung ở cột bên phải.
                            </p>
                        </div>
                    )}

                    {/* SKU preview table */}
                    {skus.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h2 className="font-bold text-gray-800 text-base">Danh sách biến thể ({skus.length} SKU)</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Xem trước các SKU sẽ được tạo, cấu hình mã và tồn kho ban đầu.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Bulk margin */}
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                                        <span className="text-xs font-semibold text-green-800 whitespace-nowrap">Lợi nhuận chung (%):</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-16 border border-green-300 rounded px-2 py-1 text-xs outline-none focus:border-green-500 bg-white text-center"
                                            value={bulkProfitMargin}
                                            onChange={e => setBulkProfitMargin(e.target.value)}
                                            placeholder="30"
                                        />
                                        <button
                                            type="button"
                                            onClick={applyBulkMargin}
                                            className="bg-green-600 text-white text-xs px-2.5 py-1 rounded font-semibold hover:bg-green-700 transition-colors"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                    <button type="button" onClick={() => setShowSkuTable(v => !v)} className="text-gray-400 hover:text-gray-600 p-1">
                                        {showSkuTable ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                </div>
                            </div>

                            {showSkuTable && (
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3">Ảnh (xem trước)</th>
                                                <th className="px-4 py-3">Biến thể</th>
                                                <th className="px-4 py-3 w-44">Mã SKU</th>
                                                <th className="px-4 py-3 w-28 text-center">Tồn kho đầu</th>
                                                <th className="px-4 py-3 w-28 text-center">Lợi nhuận %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {skus.map((sku, idx) => {
                                                const imgPreview = resolveSkuImage(sku);
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                                                {imgPreview
                                                                    ? <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                                                                    : <ImageIcon size={14} className="text-gray-300" />
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-800">{sku.name}</td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                className="border border-gray-300 px-2 py-1.5 w-full rounded text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                                                                value={sku.code}
                                                                onChange={e => {
                                                                    const s = [...skus];
                                                                    s[idx].code = e.target.value;
                                                                    setSkus(s);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="border border-gray-300 px-2 py-1.5 w-full rounded text-center text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                                value={sku.stock}
                                                                onChange={e => {
                                                                    const s = [...skus];
                                                                    s[idx].stock = parseInt(e.target.value) || 0;
                                                                    setSkus(s);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="border border-gray-300 px-2 py-1.5 w-full rounded text-center text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-semibold text-green-700"
                                                                    value={sku.profitMargin}
                                                                    onChange={e => {
                                                                        const s = [...skus];
                                                                        s[idx].profitMargin = parseFloat(e.target.value) || 0;
                                                                        setSkus(s);
                                                                    }}
                                                                />
                                                                <span className="text-xs text-gray-400">%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Image assignment summary */}
                            {imageOptions.length > 0 && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                                    <strong>Gán ảnh:</strong>{' '}
                                    {skus.map(s => {
                                        const url = resolveSkuImage(s);
                                        return url ? `✓ ${s.name}` : `✗ ${s.name}`;
                                    }).join(' · ')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── RIGHT COLUMN ──────────────────────────── */}
                <div className="space-y-5">
                    {/* Thumbnail */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h2 className="font-bold text-gray-800 text-base mb-3">Ảnh đại diện sản phẩm</h2>
                        <div className="aspect-square w-full max-w-[200px] mx-auto">
                            <ImageUpload
                                onUpload={url => setProduct({ ...product, thumbnail: url })}
                                currentImage={product.thumbnail}
                            />
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">Ảnh hiển thị trên trang danh sách</p>
                    </div>

                    {/* Category & Brand */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h2 className="font-bold text-gray-800 text-base mb-4">Phân loại</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Danh mục <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={product.categoryId}
                                    onChange={e => setProduct({ ...product, categoryId: e.target.value })}
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Thương hiệu <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={product.brandId}
                                    onChange={e => setProduct({ ...product, brandId: e.target.value })}
                                >
                                    <option value="">-- Chọn thương hiệu --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary card */}
                    {skus.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <h2 className="font-bold text-gray-800 text-base mb-3">Tóm tắt</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tổng biến thể</span>
                                    <span className="font-bold text-gray-900">{skus.length} SKU</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Nhóm phân loại</span>
                                    <span className="font-bold text-gray-900">{options.length}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Ảnh đã upload</span>
                                    <span className="font-bold text-gray-900">
                                        {skus.filter(s => resolveSkuImage(s)).length}/{skus.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg shadow-gray-900/10 active:scale-[0.98]"
                    >
                        TẠO SẢN PHẨM
                    </button>
                </div>
            </div>
        </div>
    );
}