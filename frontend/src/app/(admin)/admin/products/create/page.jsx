'use client';

import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/admin/ImageUpload';
import { Trash2, Plus, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { createProduct } from '@/services/productService';

export default function CreateProductPage() {
    const router = useRouter();

    // --- DATA MẪU ---
    // Danh sách tên nhóm chuẩn để user chọn
    const SUGGESTED_OPTION_NAMES = ["Màu sắc", "Kích thước", "Chất liệu", "Kiểu dáng"];

    // --- STATE ---
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [product, setProduct] = useState({
        name: '',
        description: '',
        categoryId: '',
        brandId: '',
        thumbnail: '',
        basePrice: '',
    });

    // Cấu hình giá
    const [profitMargin, setProfitMargin] = useState(10); // Mặc định lãi 10%
    const [globalImportPrice, setGlobalImportPrice] = useState(0); // Giá nhập chung (nếu các màu bằng giá nhau)

    const [options, setOptions] = useState([]);
    const [skus, setSkus] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catData, brandData] = await Promise.all([
                    getCategories(),
                    getBrands()
                ]);

                setCategories(catData);
                setBrands(brandData);
            } catch (error) {
                toast.error("Lỗi kết nối dữ liệu danh mục/thương hiệu");
            }
        };

        fetchData();
    }, []);

    // --- LOGIC OPTIONS ---
    const addOption = () => {
        setOptions([...options, { name: 'Màu sắc', values: [] }]); // Mặc định gợi ý Màu sắc
    };

    const updateOptionName = (index, name) => {
        const newOpts = [...options];
        newOpts[index].name = name;
        setOptions(newOpts);
    };

    const addOptionValue = (index, val) => {
        if (!val) return;
        const newOpts = [...options];
        if (!newOpts[index].values.includes(val)) {
            newOpts[index].values.push(val);
            setOptions(newOpts);
            generateSkus(newOpts);
        }
    };

    const removeOptionValue = (optIndex, valIndex) => {
        const newOpts = [...options];
        newOpts[optIndex].values.splice(valIndex, 1);
        setOptions(newOpts);
        generateSkus(newOpts);
    };

    const removeOption = (index) => {
        const newOpts = [...options];
        newOpts.splice(index, 1);
        setOptions(newOpts);
        generateSkus(newOpts);
    };

    // --- LOGIC SKU & GIÁ ---

    // Hàm tính giá bán dựa trên giá nhập và % lợi nhuận
    const calculateSellingPrice = (importPrice) => {
        if (!importPrice) return 0;
        const price = Number(importPrice) * (1 + Number(profitMargin) / 100);
        // Làm tròn đến hàng nghìn (VD: 112300 -> 113000 hoặc để nguyên tùy bạn)
        return Math.ceil(price / 1000) * 1000;
    };

    const generateSkus = (currentOptions) => {
        const validOptions = currentOptions.filter(o => o.values.length > 0);
        if (validOptions.length === 0) {
            setSkus([]);
            return;
        }

        const cartesian = (a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]]);
        const valueArrays = validOptions.map(o => o.values);
        const combinations = cartesian(valueArrays);

        const newSkus = combinations.map((combo, index) => {
            const skuName = combo.join(' - ');
            const existing = skus.find(s => s.name === skuName);

            // Nếu đã có giá nhập cũ thì giữ nguyên, không thì lấy giá nhập chung
            const importPrice = existing ? existing.importPrice : globalImportPrice;
            const sellingPrice = existing ? existing.price : calculateSellingPrice(importPrice);

            return {
                code: `SKU-${Date.now()}-${index}`,
                name: skuName,
                importPrice: importPrice, // Thêm trường giá nhập
                price: sellingPrice,      // Giá bán tự tính
                stock: existing ? existing.stock : 10,
                optionValues: combo.map((val, idx) => ({
                    optionName: validOptions[idx].name,
                    value: val
                }))
            };
        });
        setSkus(newSkus);
    };

    // Khi thay đổi giá nhập của 1 SKU
    const handleSkuImportPriceChange = (index, newImportPrice) => {
        const newSkus = [...skus];
        newSkus[index].importPrice = newImportPrice;
        // Tự động tính lại giá bán gợi ý
        newSkus[index].price = calculateSellingPrice(newImportPrice);
        setSkus(newSkus);
    };

    const handleGlobalImportPriceChange = (e) => {
        const newGlobalPrice = e.target.value;
        setGlobalImportPrice(newGlobalPrice);

        setProduct(prev => ({
            ...prev,
            basePrice: newGlobalPrice
        }));

        // Duyệt qua tất cả SKU hiện có và cập nhật lại giá nhập + giá bán
        const updatedSkus = skus.map(sku => {
            return {
                ...sku,
                importPrice: newGlobalPrice, // Gán giá nhập mới
                price: calculateSellingPrice(newGlobalPrice) // Tính lại giá bán theo % lợi nhuận hiện tại
            };
        });

        setSkus(updatedSkus);
    };

    // Khi thay đổi % lợi nhuận -> Tính lại toàn bộ giá bán
    const handleMarginChange = (newMargin) => {
        setProfitMargin(newMargin);
        const newSkus = skus.map(sku => ({
            ...sku,
            price: Number(sku.importPrice) * (1 + Number(newMargin) / 100)
        }));
        setSkus(newSkus);
    }

    // --- SUBMIT ---
    const handleSubmit = async () => {
        try {
            // 1. Validate cơ bản
            if (!product.name) return toast.warning("Vui lòng nhập tên sản phẩm!");
            if (!product.categoryId) return toast.warning("Vui lòng chọn danh mục!");
            if (!product.brandId) return toast.warning("Vui lòng chọn thương hiệu!");
            if (options.length === 0) return toast.warning("Vui lòng thêm ít nhất 1 nhóm phân loại!");
            if (skus.length === 0) return toast.warning("Vui lòng tạo các phiên bản (SKU)!");

            // 2. Chuẩn hóa dữ liệu cho khớp với Backend DTO
            const payload = {
                ...product,
                // Backend cần: values: [{ value: "Đỏ" }, { value: "Xanh" }]
                options: options.map(opt => ({
                    name: opt.name,
                    values: opt.values.map(val => ({ value: val }))
                })),
                // Backend cần: optionValues: [{ optionName: "Màu", value: "Đỏ" }]
                skus: skus.map(s => ({
                    code: s.code,
                    price: s.price,
                    stockQuantity: s.stock,
                    importPrice: s.importPrice, // Giá nhập (nếu BE đã hỗ trợ)
                    optionValues: s.optionValues // Cái này form đã sinh đúng cấu trúc rồi
                }))
            };

            // 3. Gọi API
            const loadingToast = toast.loading("Đang tạo sản phẩm...");
            await createProduct(payload);

            // 4. Thành công
            toast.dismiss(loadingToast);
            toast.success("🎉 Tạo sản phẩm thành công!");

            // Chuyển hướng về trang danh sách sau 1.5s
            setTimeout(() => {
                router.push('/admin/products');
            }, 500);

        } catch (error) {
            toast.dismiss();
            // Hiển thị lỗi từ Backend trả về (nếu có message)
            const msg = error.response?.data?.message || "Lỗi khi tạo sản phẩm";
            toast.error(`Thất bại: ${msg}`);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-center items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Thêm sản phẩm mới</h1>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- CỘT TRÁI (2 phần) --- */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. THÔNG TIN CHUNG */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Thông tin cơ bản</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                                <input
                                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={product.name}
                                    onChange={e => setProduct({ ...product, name: e.target.value })}
                                    placeholder="VD: Áo Thun Polo Premium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
                                <textarea
                                    className="w-full border border-gray-300 p-2 rounded h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={product.description}
                                    onChange={e => setProduct({ ...product, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. PHÂN LOẠI & BIẾN THỂ */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="font-bold text-gray-800">Phân loại hàng</h2>
                            <button onClick={addOption} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded">
                                <Plus size={16} /> Thêm nhóm phân loại
                            </button>
                        </div>

                        {/* --- LIST OPTIONS --- */}
                        <div className="space-y-4">
                            {options.map((opt, optIdx) => (
                                <div key={optIdx} className="bg-gray-50 p-4 rounded-lg border relative">
                                    <button
                                        onClick={() => removeOption(optIdx)}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        {/* Tên nhóm (Dropdown + Custom) */}
                                        <div className="md:col-span-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                                                Tên nhóm <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                className="w-full border border-gray-300 p-2 rounded focus:border-blue-500 outline-none bg-white"
                                                value={opt.name}
                                                onChange={e => updateOptionName(optIdx, e.target.value)}
                                            >
                                                <option value="">-- Chọn tên nhóm --</option>
                                                {SUGGESTED_OPTION_NAMES.map(name => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                            </select>

                                            {/* Gợi ý nhỏ bên dưới */}
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Chỉ được chọn các loại phân nhóm có sẵn.
                                            </p>
                                        </div>

                                        {/* Giá trị (Tag input) */}
                                        <div className="md:col-span-8">
                                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Giá trị (Enter để thêm)</label>
                                            <input
                                                className="w-full border border-gray-300 p-2 rounded focus:border-blue-500 outline-none"
                                                placeholder="VD: Đỏ, Xanh, S, M..."
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        addOptionValue(optIdx, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {opt.values.map((val, valIdx) => (
                                                    <span key={valIdx} className="bg-white border px-3 py-1 text-sm rounded-full flex items-center gap-2 shadow-sm">
                                                        {val}
                                                        <button onClick={() => removeOptionValue(optIdx, valIdx)} className="text-red-400 hover:text-red-600 font-bold">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- CẤU HÌNH GIÁ --- */}
                        {skus.length > 0 && (
                            <div className="mt-8 border-t pt-6">
                                <div className="flex flex-wrap items-end gap-4 mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Thiết lập nhanh giá nhập:</label>
                                        <input
                                            type="number"
                                            className="w-full border p-2 rounded"
                                            placeholder="Nhập giá vốn chung..."
                                            value={globalImportPrice || ''}
                                            onChange={handleGlobalImportPriceChange}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">% Lợi nhuận:</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full border p-2 rounded pr-8 font-bold text-blue-600"
                                                value={profitMargin}
                                                onChange={(e) => handleMarginChange(e.target.value)}
                                            />
                                            <span className="absolute right-3 top-2 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 pb-2 italic">
                                        * Hệ thống sẽ tự tính Giá bán = Giá nhập + Lợi nhuận
                                    </div>
                                </div>

                                {/* TABLE SKU */}
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="p-3">Phiên bản</th>
                                                <th className="p-3 w-40">Giá Nhập (VND)</th>
                                                <th className="p-3 w-8 text-center"><ArrowRight size={14} /></th>
                                                <th className="p-3 w-40">Giá Bán (VND)</th>
                                                <th className="p-3 w-32">Kho hàng</th>
                                                <th className="p-3">Mã SKU</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {skus.map((sku, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium text-gray-800">{sku.name}</td>
                                                    <td className="p-3">
                                                        <div className="space-y-1">
                                                            <input
                                                                type="number"
                                                                className="border border-gray-300 p-2 w-full rounded focus:border-blue-500"
                                                                value={sku.importPrice || ''} // Giữ nguyên số thô
                                                                placeholder="0"
                                                                onChange={e => handleSkuImportPriceChange(idx, e.target.value)}
                                                            />
                                                            {/* Hiển thị format tiền bên dưới để dễ nhìn */}
                                                            <div className="text-xs text-gray-500 text-right">
                                                                {formatCurrency(sku.importPrice || 0)}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-3 text-center text-gray-400">→</td>

                                                    <td className="p-3">
                                                        <div className="space-y-1">
                                                            <input
                                                                type="number"
                                                                className="border border-blue-300 bg-blue-50 text-blue-700 font-bold p-2 w-full rounded focus:border-blue-500"
                                                                value={sku.price} // QUAN TRỌNG: Phải là số thô (150000)
                                                                onChange={e => {
                                                                    const newSkus = [...skus];
                                                                    newSkus[idx].price = e.target.value;
                                                                    setSkus(newSkus);
                                                                }}
                                                            />
                                                            {/* Hiển thị format tiền bên dưới */}
                                                            <div className="text-xs text-blue-600 font-bold text-right">
                                                                {formatCurrency(sku.price)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number"
                                                            className="border border-gray-300 p-2 w-full rounded text-center"
                                                            value={sku.stock}
                                                            onChange={e => {
                                                                const newSkus = [...skus];
                                                                newSkus[idx].stock = e.target.value;
                                                                setSkus(newSkus);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-gray-400 text-xs font-mono">{sku.code}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CỘT PHẢI: SETTING --- */}
                <div className="space-y-6">
                    {/* HÌNH ẢNH */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4">Hình ảnh đại diện</h2>
                        <ImageUpload
                            onUpload={(url) => setProduct({ ...product, thumbnail: url })}
                            currentImage={product.thumbnail}
                        />
                    </div>

                    {/* DANH MỤC & THƯƠNG HIỆU */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4">Phân loại</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Danh mục</label>
                                <select
                                    className="w-full border border-gray-300 p-2 rounded"
                                    onChange={e => setProduct({ ...product, categoryId: e.target.value })}
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thương hiệu</label>
                                <select
                                    className="w-full border border-gray-300 p-2 rounded"
                                    onChange={e => setProduct({ ...product, brandId: e.target.value })}
                                >
                                    <option value="">-- Chọn thương hiệu --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg shadow-sm flex justify-center">
                        <button onClick={handleSubmit} className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow cursor-pointer">
                            LƯU SẢN PHẨM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}