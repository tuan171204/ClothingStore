'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import {
    ArrowLeft, Save, Loader2, Plus, X, Trash2,
    CheckCircle2, XCircle, ImageIcon, Upload, Link2,
} from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/common/ImageUpload';
import { getProductById, toggleSkuStatus, updateProduct } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { productOptionService } from '@/services/productOptionService';
import { uploadImage } from '@/services/uploadService';

// ─────────────────────────────────────────────────────────────
// GroupImageUploader — reusable for edit page
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
            <div className="w-14 h-14 rounded-lg border border-gray-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                {currentUrl
                    ? <img src={currentUrl} alt={groupLabel} className="w-full h-full object-cover" />
                    : <ImageIcon size={20} className="text-gray-300" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 truncate">{groupLabel}</p>
                {currentUrl
                    ? <p className="text-sm text-green-600 mt-0.5 flex items-center gap-1"><Link2 size={10} /> Đã có ảnh</p>
                    : <p className="text-sm text-gray-400 mt-0.5">Chưa có ảnh</p>
                }
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {currentUrl && (
                    <button type="button" onClick={() => onUpload('')}
                        className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5 rounded border border-red-200 hover:border-red-400 transition-colors">
                        Xóa
                    </button>
                )}
                <label className={`cursor-pointer text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors
                    ${uploading ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed' : 'border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
                    {uploading
                        ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Uploading...</span>
                        : <span className="flex items-center gap-1"><Upload size={12} />{currentUrl ? 'Đổi ảnh' : 'Upload'}</span>
                    }
                    <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={handleFile} />
                </label>
            </div>
        </div>
    );
}

const IMAGE_OPTION_NAMES = ['màu sắc', 'màu', 'color', 'colour'];
const isImageOption = (name) => IMAGE_OPTION_NAMES.includes(name?.toLowerCase().trim());

// ─────────────────────────────────────────────────────────────
// Build groupImages from existing SKUs
// groupImages: { [optionName]: { [value]: url } }
// ─────────────────────────────────────────────────────────────
function buildGroupImagesFromSkus(skus) {
    const result = {};
    for (const sku of skus) {
        if (!sku.imgUrl) continue;
        for (const ov of (sku.optionValues || [])) {
            if (isImageOption(ov.optionName)) {
                if (!result[ov.optionName]) result[ov.optionName] = {};
                // First seen wins (consistent across sizes)
                if (!result[ov.optionName][ov.value]) {
                    result[ov.optionName][ov.value] = sku.imgUrl;
                }
            }
        }
    }
    return result;
}

// Resolve imgUrl for a SKU from groupImages, fall back to sku.imgUrl
function resolveSkuImage(sku, groupImages) {
    for (const ov of (sku.optionValues || [])) {
        const url = groupImages[ov.optionName]?.[ov.value];
        if (url) return url;
    }
    return sku.imgUrl || '';
}

// ─────────────────────────────────────────────────────────────
// Main Edit Page
// ─────────────────────────────────────────────────────────────
export default function EditProductPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [product, setProduct] = useState({
        name: '', description: '', categoryId: '', brandId: '', thumbnail: '', basePrice: ''
    });
    const [options, setOptions] = useState([]);
    const [skus, setSkus] = useState([]);

    // groupImages: { [optionName]: { [value]: url } }
    const [groupImages, setGroupImages] = useState({});

    const [newOption, setNewOption] = useState({ name: '', valuesStr: '' });
    const [isProcessingOption, setIsProcessingOption] = useState(false);
    const [isSavingSkus, setIsSavingSkus] = useState(false);

    // ── Data fetching ─────────────────────────────────────────
    const fetchOptionsData = useCallback(async () => {
        const data = await productOptionService.getOptionsByProductId(id);
        setOptions(data);
    }, [id]);

    const fetchSkusData = useCallback(async () => {
        const pData = await getProductById(id);
        if (pData?.skus) {
            setSkus(pData.skus);
            // Re-derive groupImages from fresh SKU data
            setGroupImages(prev => {
                const fromSkus = buildGroupImagesFromSkus(pData.skus);
                // Merge: keep user edits (prev) but fill in any missing from fromSkus
                const merged = { ...fromSkus };
                for (const [optName, vals] of Object.entries(prev)) {
                    merged[optName] = { ...(merged[optName] || {}), ...vals };
                }
                return merged;
            });
        }
    }, [id]);

    useEffect(() => {
        const init = async () => {
            try {
                const [pData, cData, bData] = await Promise.all([
                    getProductById(id), getCategories(), getBrands()
                ]);
                if (pData) {
                    setProduct({
                        name: pData.name || '',
                        description: pData.description || '',
                        categoryId: pData.category?.id || '',
                        brandId: pData.brand?.id || '',
                        thumbnail: pData.thumbnail || '',
                        basePrice: pData.basePrice || ''
                    });
                    setSkus(pData.skus || []);
                    setGroupImages(buildGroupImagesFromSkus(pData.skus || []));
                }
                setCategories(cData);
                setBrands(bData);
                await fetchOptionsData();
            } catch {
                toast.error('Lỗi khi tải dữ liệu!');
            } finally {
                setLoading(false);
            }
        };
        if (id) init();
    }, [id, fetchOptionsData]);

    // ── Group image helpers ───────────────────────────────────
    const setGroupImage = (optionName, value, url) => {
        setGroupImages(prev => ({
            ...prev,
            [optionName]: { ...(prev[optionName] || {}), [value]: url },
        }));
    };

    // ── Option management ─────────────────────────────────────
    const handleUpdateBasicInfo = async () => {
        try {
            await updateProduct(id, {
                ...product,
                basePrice: product.basePrice ? Number(product.basePrice) : 0,
                categoryId: product.categoryId ? Number(product.categoryId) : null,
                brandId: product.brandId ? Number(product.brandId) : null,
            });
            toast.success('Cập nhật thông tin cơ bản thành công!');
        } catch {
            toast.error('Cập nhật thất bại!');
        }
    };

    const handleCreateOption = async () => {
        if (!newOption.name.trim() || !newOption.valuesStr.trim()) {
            return toast.warning('Vui lòng nhập tên và ít nhất 1 giá trị!');
        }
        setIsProcessingOption(true);
        try {
            const vals = newOption.valuesStr.split(',').map(v => v.trim()).filter(Boolean).map(v => ({ value: v }));
            await productOptionService.createOption(id, { name: newOption.name, values: vals });
            toast.success('Đã thêm thuộc tính mới!');
            setNewOption({ name: '', valuesStr: '' });
            await fetchOptionsData();
            await fetchSkusData();
        } catch {
            toast.error('Lỗi khi thêm thuộc tính');
        } finally {
            setIsProcessingOption(false);
        }
    };

    const handleAddValue = async (optionId, valueText) => {
        if (!valueText.trim()) return;
        try {
            await productOptionService.addValueToOption(optionId, { value: valueText.trim() });
            toast.success(`Đã thêm: ${valueText}`);
            await fetchOptionsData();
            await fetchSkusData();
        } catch {
            toast.error('Lỗi thêm giá trị!');
        }
    };

    const handleDeleteOption = async (optionId) => {
        if (!confirm('CẢNH BÁO: Xóa thuộc tính này có thể ẩn các SKU hiện tại. Tiếp tục?')) return;
        try {
            await productOptionService.deleteOption(optionId);
            toast.success('Đã xóa thuộc tính!');
            await fetchOptionsData();
            await fetchSkusData();
        } catch {
            toast.error('Lỗi khi xóa!');
        }
    };

    const handleDeleteOptionValue = async (valueId) => {
        if (!confirm('Xác nhận xóa/ẩn giá trị này?')) return;
        try {
            await productOptionService.deleteOptionValue(valueId);
            toast.success('Đã xóa giá trị!');
            await fetchOptionsData();
            await fetchSkusData();
        } catch (err) {
            toast.error(err?.message || 'Không thể xóa giá trị này!');
        }
    };

    // ── SKU save (with grouped images applied) ────────────────
    const handleSaveSkusMatrix = async () => {
        setIsSavingSkus(true);
        try {
            // Build skus with imgUrl resolved from groupImages
            const skusWithImages = skus.map(sku => ({
                ...sku,
                imgUrl: resolveSkuImage(sku, groupImages),
            }));

            await updateProduct(id, { ...product, skus: skusWithImages });
            toast.success('Cập nhật biến thể và ảnh thành công!');
            await fetchSkusData();
        } catch {
            toast.error('Lỗi khi cập nhật!');
        } finally {
            setIsSavingSkus(false);
        }
    };

    const handleToggleSkuStatus = async (skuId) => {
        try {
            const updated = await toggleSkuStatus(skuId);
            setSkus(prev => prev.map(s => s.id === skuId ? updated : s));
            toast.success('Đã cập nhật trạng thái SKU');
        } catch {
            toast.error('Không thể cập nhật trạng thái');
        }
    };

    const handleSkuChange = (index, field, value) => {
        setSkus(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    // ── Derived ───────────────────────────────────────────────
    const imageOptions = options.filter(o => isImageOption(o.name) && o.values?.some(v => v.isActive !== false));
    const imgCount = skus.filter(s => resolveSkuImage(s, groupImages)).length;

    if (loading) return (
        <div className="p-10 text-center text-gray-500">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            <p className="text-sm">Đang tải dữ liệu...</p>
        </div>
    );

    return (
        <div className="p-4 max-w-6xl mx-auto font-sans text-sm pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa Sản phẩm <span className="text-gray-400">#{id}</span></h1>
                    <p className="text-xs text-gray-400 mt-0.5">Cập nhật thông tin, phân loại và ảnh theo nhóm màu sắc</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5">

                {/* ─── MODULE 1: BASIC INFO ─────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-base font-bold mb-4 pb-3 border-b border-gray-100 text-gray-800">Thông tin cơ bản</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block font-medium mb-1.5 text-gray-700">Tên sản phẩm</label>
                            <input type="text"
                                className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                value={product.name}
                                onChange={e => setProduct({ ...product, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1.5 text-gray-700">Giá bán hiển thị (VNĐ)</label>
                            <input type="number"
                                readOnly
                                className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                value={product.basePrice}
                                onChange={e => setProduct({ ...product, basePrice: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1.5 text-gray-700">Mô tả</label>
                            <textarea rows={2}
                                className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-colors"
                                value={product.description}
                                onChange={e => setProduct({ ...product, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1.5 text-gray-700">Ảnh đại diện chung</label>
                            <div className="w-28 h-28">
                                <ImageUpload
                                    onUpload={url => setProduct({ ...product, thumbnail: url })}
                                    currentImage={product.thumbnail}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block font-medium mb-1.5 text-gray-700">Danh mục</label>
                                <select
                                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={product.categoryId || ''}
                                    onChange={e => setProduct({ ...product, categoryId: e.target.value })}
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1.5 text-gray-700">Thương hiệu</label>
                                <select
                                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={product.brandId || ''}
                                    onChange={e => setProduct({ ...product, brandId: e.target.value })}
                                >
                                    <option value="">-- Chọn thương hiệu --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <button onClick={handleUpdateBasicInfo}
                            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 transition-colors text-sm cursor-pointer">
                            <Save size={15} /> Lưu thông tin
                        </button>
                    </div>
                </div>

                {/* ─── MODULE 2: OPTIONS MANAGEMENT ────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-base font-bold mb-4 pb-3 border-b border-gray-100 text-gray-800">Quản lý Thuộc tính</h2>

                    {/* Existing options */}
                    <div className="space-y-4 mb-5">
                        {options.map(opt => (
                            <div key={opt.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">{opt.name}</span>
                                        {isImageOption(opt.name) && (
                                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full">
                                                <ImageIcon size={10} /> Nhóm ảnh
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => handleDeleteOption(opt.id)}
                                        className="text-red-400 hover:text-red-600 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer">
                                        <Trash2 size={13} /> Xóa nhóm
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center">
                                    {opt.values?.filter(v => v.isActive !== false).map(val => (
                                        <span key={val.id}
                                            className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded-full shadow-sm">
                                            {val.value}
                                            <X size={11} className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                                                onClick={() => handleDeleteOptionValue(val.id)} />
                                        </span>
                                    ))}
                                    {/* Add value inline */}
                                    <AddValueInline onAdd={val => handleAddValue(opt.id, val)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add new option */}
                    <div className="p-4 border border-blue-100 bg-blue-50/40 rounded-xl">
                        <h3 className="text-sm font-bold mb-3 text-blue-800 flex items-center gap-1.5">
                            <Plus size={14} /> Tạo nhóm thuộc tính mới
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <input type="text" placeholder="Tên nhóm (VD: Màu sắc)"
                                className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white w-full sm:w-1/3"
                                value={newOption.name} onChange={e => setNewOption({ ...newOption, name: e.target.value })} />
                            <input type="text" placeholder="Các giá trị, cách nhau dấu phẩy (VD: Đỏ, Xanh, Vàng)"
                                className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white flex-1"
                                value={newOption.valuesStr} onChange={e => setNewOption({ ...newOption, valuesStr: e.target.value })} />
                            <button onClick={handleCreateOption} disabled={isProcessingOption}
                                className="bg-gray-900 text-white px-5 py-2 rounded-lg font-bold hover:bg-black disabled:opacity-50 whitespace-nowrap text-sm cursor-pointer transition-colors">
                                {isProcessingOption ? <Loader2 size={14} className="animate-spin" /> : 'Thêm nhóm'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── MODULE 3: GROUP IMAGE UPLOAD ────────────── */}
                {imageOptions.length > 0 && (
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <ImageIcon size={18} className="text-amber-500" />
                            <h2 className="text-base font-bold text-gray-800">Ảnh theo nhóm màu sắc</h2>
                            <span className="ml-auto text-xs text-gray-400">{imgCount}/{skus.length} SKU có ảnh</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload <strong>1 ảnh mỗi màu</strong>. Hệ thống tự gán ảnh đó cho tất cả SKU cùng màu (VD: Đỏ-S, Đỏ-M, Đỏ-L dùng chung ảnh Đỏ). Nhấn <strong>"Lưu biến thể"</strong> để áp dụng.
                        </p>

                        {imageOptions.map(opt => (
                            <div key={opt.id || opt.name} className="mb-4 last:mb-0">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{opt.name}</p>
                                <div className="space-y-2">
                                    {opt.values?.filter(v => v.isActive !== false).map(val => (
                                        <GroupImageUploader
                                            key={val.id}
                                            groupLabel={val.value}
                                            currentUrl={groupImages[opt.name]?.[val.value] || ''}
                                            onUpload={url => setGroupImage(opt.name, val.value, url)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Live preview of assignment */}
                        {skus.length > 0 && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm font-bold text-amber-800 mb-2">Xem trước gán ảnh:</p>
                                <div className="flex flex-wrap gap-2">
                                    {skus.map(s => {
                                        const url = resolveSkuImage(s, groupImages);
                                        return (
                                            <div key={s.id || s.code} className={`flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-full border
                                                ${url ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                                {url
                                                    ? <img src={url} alt="" className="w-8 h-8 rounded-full object-cover border border-green-300" />
                                                    : <ImageIcon size={11} />
                                                }
                                                {s.skuName || s.name || s.code}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MODULE 4: SKU MATRIX ─────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 border-t-4 border-t-blue-600 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-100 gap-3">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Cấu hình biến thể (SKU)</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Cập nhật mã SKU và ảnh từng biến thể. Ảnh theo nhóm màu được áp dụng tự động.</p>
                        </div>
                        <button onClick={handleSaveSkusMatrix} disabled={isSavingSkus}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-200 disabled:opacity-50 cursor-pointer transition-colors whitespace-nowrap">
                            {isSavingSkus ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {isSavingSkus ? 'Đang lưu...' : 'Lưu biến thể & ảnh'}
                        </button>
                    </div>

                    {skus.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                        <th className="px-4 py-3 text-center">Ảnh</th>
                                        <th className="px-4 py-3">Biến thể</th>
                                        <th className="px-4 py-3 w-44">Mã SKU</th>
                                        <th className="px-4 py-3 text-center w-28">Tồn kho</th>
                                        <th className="px-4 py-3 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skus.map((sku, idx) => {
                                        const variantName = sku.optionValues?.map(ov => ov.value).join(' - ') || sku.skuName || 'N/A';
                                        const isHidden = sku.isActive === false;
                                        const resolvedImg = resolveSkuImage(sku, groupImages);
                                        const hasGroupImage = sku.optionValues?.some(ov => groupImages[ov.optionName]?.[ov.value]);

                                        return (
                                            <tr key={sku.id || idx}
                                                className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${isHidden ? 'opacity-50' : ''}`}>
                                                {/* Image cell - Sửa lại phần này */}
                                                <td className="px-4 py-4 text-center align-middle w-24">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <div className="relative w-14 h-14 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                                            {resolvedImg ? (
                                                                <div className="group relative w-full h-full">
                                                                    <img src={resolvedImg} alt="" className="w-full h-full object-cover" />
                                                                    {/* Overlay khi có ảnh từ nhóm màu */}
                                                                    {hasGroupImage && (
                                                                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
                                                                            <Link2 size={16} className="text-white drop-shadow-md" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
                                                                    <ImageIcon size={20} className="text-gray-300" />
                                                                </div>
                                                            )}

                                                            {/* Nút upload đè lên nếu KHÔNG dùng ảnh nhóm màu */}
                                                            {!hasGroupImage && (
                                                                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                                                                    <ImageUpload
                                                                        onUpload={url => handleSkuChange(idx, 'imgUrl', url)}
                                                                        currentImage={sku.imgUrl || ''}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {hasGroupImage && (
                                                            <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">Theo màu</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Variant name */}
                                                <td className="px-4 py-3 align-middle">
                                                    <span className={`font-semibold ${isHidden ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                        {variantName}
                                                    </span>
                                                    {hasGroupImage && (
                                                        <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                                            <Link2 size={9} /> Ảnh từ nhóm màu
                                                        </p>
                                                    )}
                                                </td>

                                                {/* SKU code */}
                                                <td className="px-4 py-3 align-middle">
                                                    <input type="text"
                                                        className="border border-gray-300 px-2 py-1.5 w-full rounded-lg text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 uppercase"
                                                        value={sku.code || ''}
                                                        onChange={e => handleSkuChange(idx, 'code', e.target.value)}
                                                        disabled={isHidden}
                                                    />
                                                </td>

                                                {/* Stock */}
                                                <td className="px-4 py-3 align-middle text-center">
                                                    <span className={`font-semibold ${(sku.stockQuantity || 0) === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                                                        {sku.stockQuantity ?? 0}
                                                    </span>
                                                </td>

                                                {/* Toggle status */}
                                                <td className="px-4 py-3 text-center align-middle">
                                                    <button onClick={() => handleToggleSkuStatus(sku.id)}
                                                        className="transition-transform active:scale-95 cursor-pointer">
                                                        {isHidden ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-500 text-xs uppercase font-bold rounded-full hover:bg-gray-300 transition-colors">
                                                                <XCircle size={12} /> Ẩn
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs uppercase font-bold rounded-full hover:bg-green-200 transition-colors">
                                                                <CheckCircle2 size={12} /> Đang bán
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            <Plus size={24} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Chưa có biến thể nào. Thêm thuộc tính để tự động tạo SKU.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Small inline component for adding option values
// ─────────────────────────────────────────────────────────────
function AddValueInline({ onAdd }) {
    const [val, setVal] = useState('');
    const [show, setShow] = useState(false);

    const submit = () => {
        if (!val.trim()) return;
        onAdd(val.trim());
        setVal('');
        setShow(false);
    };

    if (!show) {
        return (
            <button type="button" onClick={() => setShow(true)}
                className="text-xs text-blue-500 hover:text-blue-700 border border-dashed border-blue-300 hover:border-blue-500 px-3 py-1.5 rounded-full transition-colors">
                + Thêm giá trị
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <input
                autoFocus
                type="text"
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') setShow(false); }}
                placeholder="Nhập giá trị..."
                className="border border-blue-300 px-2.5 py-1.5 text-xs rounded-lg w-32 outline-none focus:border-blue-500 bg-white"
            />
            <button type="button" onClick={submit}
                className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors">
                OK
            </button>
            <button type="button" onClick={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600 p-1">
                <X size={13} />
            </button>
        </div>
    );
}