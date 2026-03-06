'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Loader2, Plus, X, Trash2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';
import { getProductById, updateProduct, formatCurrency } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { productOptionService } from '@/services/productOptionService';

export default function EditProductPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);

    // --- STATE CƠ BẢN ---
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [product, setProduct] = useState({
        name: '', description: '', categoryId: '', brandId: '', thumbnail: '', basePrice: ''
    });

    // --- STATE THUỘC TÍNH & SKU ---
    const [options, setOptions] = useState([]);
    const [skus, setSkus] = useState([]);

    // State cho Form thêm thuộc tính mới
    const [newOption, setNewOption] = useState({ name: '', valuesStr: '' });
    const [isProcessingOption, setIsProcessingOption] = useState(false);
    const [isSavingSkus, setIsSavingSkus] = useState(false);

    // --- STATE CHO SET GIÁ HÀNG LOẠT ---
    const [profitMargin, setProfitMargin] = useState(10); // Mặc định lãi 10%
    const [globalImportPrice, setGlobalImportPrice] = useState('');

    // --- HÀM TẢI DỮ LIỆU ---
    const fetchOptionsData = async () => {
        const optionsData = await productOptionService.getOptionsByProductId(id);
        setOptions(optionsData);
    };

    const fetchSkusData = async () => {
        const pData = await getProductById(id);
        if (pData && pData.skus) {
            setSkus(pData.skus);
        }
    };

    useEffect(() => {
        const initData = async () => {
            try {
                const [pData, cData, bData] = await Promise.all([
                    getProductById(id),
                    getCategories(),
                    getBrands()
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
                }
                setCategories(cData);
                setBrands(bData);

                await fetchOptionsData();
            } catch (error) {
                toast.error("Lỗi khi tải dữ liệu!");
            } finally {
                setLoading(false);
            }
        };
        if (id) initData();
    }, [id]);

    // --- HANDLERS CHO THÔNG TIN CƠ BẢN ---
    const handleUpdateBasicInfo = async () => {
        try {
            await updateProduct(id, product);
            toast.success("Cập nhật thông tin cơ bản thành công!");
        } catch (error) {
            toast.error("Cập nhật thất bại!");
        }
    };

    // --- HANDLERS CHO MODULE THUỘC TÍNH ---
    const handleCreateOption = async () => {
        if (!newOption.name.trim() || !newOption.valuesStr.trim()) {
            return toast.warning("Vui lòng nhập tên và ít nhất 1 giá trị!");
        }
        setIsProcessingOption(true);
        try {
            const valuesArray = newOption.valuesStr.split(',')
                .map(v => v.trim())
                .filter(v => v !== '')
                .map(v => ({ value: v }));

            await productOptionService.createOption(id, { name: newOption.name, values: valuesArray });
            toast.success("Đã thêm thuộc tính mới!");
            setNewOption({ name: '', valuesStr: '' });

            await fetchOptionsData();
            await fetchSkusData();
        } catch (error) {
            toast.error("Lỗi khi thêm thuộc tính");
        } finally {
            setIsProcessingOption(false);
        }
    };

    const handleAddValue = async (optionId, valueText) => {
        if (!valueText.trim()) return;
        try {
            await productOptionService.addValueToOption(optionId, { value: valueText.trim() });
            toast.success(`Đã thêm giá trị: ${valueText}`);
            await fetchOptionsData();
            await fetchSkusData();
        } catch (error) {
            toast.error("Lỗi thêm giá trị!");
        }
    };

    const handleDeleteOption = async (optionId) => {
        if (!window.confirm("CẢNH BÁO: Xóa thuộc tính này có thể làm ẩn các SKU hiện tại. Bạn chắc chắn?")) return;
        try {
            await productOptionService.deleteOption(optionId);
            toast.success("Đã xóa thuộc tính!");
            await fetchOptionsData();
            await fetchSkusData();
        } catch (error) {
            toast.error("Lỗi khi xóa!");
        }
    };

    const handleDeleteOptionValue = async (valueId) => {
        if (!window.confirm("Xác nhận xóa/ẩn giá trị này? (Sẽ chặn nếu kho vẫn còn hàng)")) return;
        try {
            await productOptionService.deleteOptionValue(valueId);
            toast.success("Đã xóa giá trị thành công!");
            await fetchOptionsData();
            await fetchSkusData();
        } catch (error) {
            toast.error(error.message || "Không thể xóa giá trị này!");
        }
    };

    // ==========================================
    // --- HANDLERS CHO MATRIX SKU ---
    // ==========================================

    const handleSkuChange = (index, field, value) => {
        const updatedSkus = [...skus];
        updatedSkus[index][field] = value;
        setSkus(updatedSkus);
    };

    // HÀM ÁP DỤNG GIÁ NHẬP VÀ TÍNH TỰ ĐỘNG GIÁ BÁN
    const applyGlobalPrice = () => {
        if (!globalImportPrice || globalImportPrice <= 0) {
            return toast.warning("Vui lòng nhập Giá nhập chung hợp lệ!");
        }

        const margin = profitMargin || 0;
        // Tính giá bán: Giá nhập + (Giá nhập * % lợi nhuận / 100)
        const calculatedSellingPrice = Number(globalImportPrice) + (Number(globalImportPrice) * Number(margin) / 100);

        const updatedSkus = skus.map(sku => {
            if (sku.isActive === false) return sku; // Không cập nhật các SKU đã ẩn
            return {
                ...sku,
                importPrice: globalImportPrice,
                price: calculatedSellingPrice
            };
        });

        setSkus(updatedSkus);
        toast.success("Đã áp dụng giá mới cho toàn bộ phân loại đang bán!");
    };

    const handleSaveSkusMatrix = async () => {
        setIsSavingSkus(true);
        try {
            const payload = {
                ...product,
                skus: skus
            };
            await updateProduct(id, payload);
            toast.success("Cập nhật Ma trận Tồn kho, Giá & Ảnh thành công!");
            await fetchSkusData();
        } catch (error) {
            toast.error("Lỗi khi cập nhật Ma trận SKU!");
        } finally {
            setIsSavingSkus(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /> Đang tải dữ liệu...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto font-sans text-sm pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa Sản phẩm #{id}</h1>
            </div>

            <div className="grid grid-cols-1 gap-6">

                {/* --- MODULE 1: THÔNG TIN CƠ BẢN --- */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2">Thông tin cơ bản</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block font-medium mb-1">Tên sản phẩm</label>
                            <input
                                type="text" className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Giá bán mặc định (VNĐ)</label>
                            <input
                                type="number" className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={product.basePrice} onChange={e => setProduct({ ...product, basePrice: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Ảnh đại diện Sản phẩm chung</label>
                            <div className="w-48">
                                <ImageUpload
                                    onUpload={(url) => setProduct({ ...product, thumbnail: url })}
                                    currentImage={product.thumbnail}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Danh mục</label>
                            <select
                                className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={product.categoryId || ''} onChange={e => setProduct({ ...product, categoryId: e.target.value })}
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Thương hiệu</label>
                            <select
                                className="w-full border p-2 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                value={product.brandId || ''} onChange={e => setProduct({ ...product, brandId: e.target.value })}
                            >
                                <option value="">-- Chọn thương hiệu --</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={handleUpdateBasicInfo} className="cursor-pointer bg-gray-800 text-white px-6 py-2 rounded-md font-bold hover:bg-black flex items-center gap-2">
                            <Save size={18} /> LƯU THÔNG TIN CƠ BẢN
                        </button>
                    </div>
                </div>

                {/* --- MODULE 2: QUẢN LÝ THUỘC TÍNH (OPTIONS) --- */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2">Quản lý Thuộc tính (Màu sắc, Kích cỡ...)</h2>
                    <div className="space-y-4 mb-6">
                        {options.map((opt) => (
                            <div key={opt.id} className="p-4 border border-gray-200 rounded-md bg-gray-50/50">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-gray-800 text-base">{opt.name}</span>
                                    <button onClick={() => handleDeleteOption(opt.id)} className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1">
                                        <Trash2 size={14} /> Xóa thuộc tính
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {opt.values?.map(val =>
                                        val.isActive !== false && (
                                            <span key={val.id} className={`px-3 py-1.5 border rounded-md text-sm flex items-center gap-2 shadow-sm ${val.isActive !== false ? 'bg-white border-gray-300' : 'bg-gray-200 border-gray-300 text-gray-500 line-through'}`}>
                                                {val.value}
                                                <X size={14} className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors" onClick={() => handleDeleteOptionValue(val.id)} />
                                            </span>
                                        )
                                    )}
                                    <div className="ml-2 relative">
                                        <input
                                            type="text" placeholder="+ Thêm giá trị (Enter)"
                                            className="border border-dashed border-gray-400 px-3 py-1.5 text-sm rounded-md w-40 focus:outline-none focus:border-blue-500 focus:bg-white bg-transparent transition-all"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddValue(opt.id, e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-md">
                                Sản phẩm chưa có thuộc tính phân loại nào.
                            </div>
                        )}
                    </div>

                    <div className="p-4 border border-blue-100 rounded-md bg-blue-50/30">
                        <h3 className="text-sm font-bold mb-3 text-blue-800 flex items-center gap-2">
                            <Plus size={16} /> Tạo nhóm thuộc tính mới
                        </h3>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="text" placeholder="Tên thuộc tính (VD: Màu sắc)"
                                className="border border-gray-300 p-2.5 rounded-md w-full md:w-1/3 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                value={newOption.name} onChange={e => setNewOption({ ...newOption, name: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Các giá trị (VD: Đỏ, Xanh, Vàng)"
                                className="border border-gray-300 p-2.5 rounded-md w-full md:w-2/3 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                value={newOption.valuesStr} onChange={e => setNewOption({ ...newOption, valuesStr: e.target.value })}
                            />
                            <button
                                onClick={handleCreateOption} disabled={isProcessingOption}
                                className="bg-gray-900 text-white px-6 py-2.5 rounded-md font-bold hover:bg-black disabled:opacity-50 whitespace-nowrap cursor-pointer"
                            >
                                {isProcessingOption ? 'ĐANG XỬ LÝ...' : 'THÊM THUỘC TÍNH'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- MODULE 3: MATRIX SKU --- */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-blue-600">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b pb-4 gap-4">
                        <div>
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Cấu hình biến thể (SKU)</h2>
                            <p className="text-gray-500 mt-1">Cài đặt ảnh, giá bán và tồn kho cho từng phân loại.</p>
                        </div>
                        <button
                            onClick={handleSaveSkusMatrix}
                            disabled={isSavingSkus}
                            className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                        >
                            {isSavingSkus ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSavingSkus ? 'ĐANG LƯU...' : 'LƯU TẤT CẢ BIẾN THỂ'}
                        </button>
                    </div>

                    {/* KHU VỰC THIẾT LẬP GIÁ HÀNG LOẠT */}
                    {skus && skus.length > 0 && (
                        <div className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                            <div className="flex items-center gap-2 w-full mb-1">
                                <Zap className="text-amber-500" size={18} />
                                <span className="font-bold text-gray-700">Thiết lập giá bán nhanh</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Giá nhập gốc (VNĐ)</label>
                                <input
                                    type="number"
                                    className="border border-gray-300 p-2.5 rounded focus:ring-1 focus:ring-blue-500 outline-none w-48 bg-white"
                                    value={globalImportPrice}
                                    onChange={e => setGlobalImportPrice(e.target.value)}
                                    placeholder="VD: 150000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Lợi nhuận (%)</label>
                                <input
                                    type="number"
                                    className="border border-gray-300 p-2.5 rounded focus:ring-1 focus:ring-blue-500 outline-none w-32 bg-white"
                                    value={profitMargin}
                                    onChange={e => setProfitMargin(e.target.value)}
                                    placeholder="VD: 10"
                                />
                            </div>
                            <button
                                onClick={applyGlobalPrice}
                                className="bg-gray-800 text-white px-5 py-2.5 rounded font-bold hover:bg-black transition-colors cursor-pointer text-sm"
                            >
                                ÁP DỤNG
                            </button>
                        </div>
                    )}

                    {/* BẢNG MATRIX SKU CÓ ẢNH */}
                    {skus && skus.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600">
                                        <th className="p-4 font-bold w-24 text-center">Ảnh SKU</th>
                                        <th className="p-4 font-bold">Phân loại</th>
                                        <th className="p-4 font-bold">Mã SKU</th>
                                        <th className="p-4 font-bold text-right">Giá nhập</th>
                                        <th className="p-4 font-bold text-right">Giá bán</th>
                                        <th className="p-4 font-bold text-right w-28">Kho</th>
                                        <th className="p-4 font-bold text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skus.map((sku, index) => {
                                        const variantName = sku.optionValues?.map(ov => ov.value).join(' - ') || 'N/A';
                                        const isHidden = sku.isActive === false;

                                        return (
                                            <tr key={sku.id || index} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${isHidden ? 'bg-gray-50 opacity-60' : ''}`}>

                                                {/* Cột Upload Ảnh Sku */}
                                                <td className="p-3 align-middle text-center border-r border-gray-100">
                                                    <div className="w-16 h-16 mx-auto">
                                                        <ImageUpload
                                                            onUpload={(url) => handleSkuChange(index, 'imgUrl', url)}
                                                            currentImage={sku.imgUrl || ''}
                                                        />
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    <span className={`font-bold ${isHidden ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                        {variantName}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text" className="border border-gray-300 p-2 rounded w-full focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                                                        value={sku.code || ''} onChange={(e) => handleSkuChange(index, 'code', e.target.value)}
                                                        disabled={isHidden}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" className="border border-gray-300 p-2 rounded w-full text-right focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100 text-gray-500"
                                                        value={sku.importPrice || ''} onChange={(e) => handleSkuChange(index, 'importPrice', e.target.value)}
                                                        disabled={isHidden}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" className="border border-gray-300 p-2 rounded w-full text-right focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100 font-medium text-blue-700"
                                                        value={sku.price || ''} onChange={(e) => handleSkuChange(index, 'price', e.target.value)}
                                                        disabled={isHidden}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" className="border border-gray-300 p-2 rounded w-full text-right focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100 font-bold"
                                                        value={sku.stockQuantity || 0} onChange={(e) => handleSkuChange(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                                                        disabled={isHidden}
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    {isHidden ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-500 text-[10px] uppercase font-bold rounded">
                                                            <XCircle size={12} /> Đã ẩn
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded">
                                                            <CheckCircle2 size={12} /> Bán
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Plus className="text-gray-400" size={24} />
                            </div>
                            Sản phẩm chưa có biến thể SKU nào. Hãy thêm thuộc tính bên trên.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}