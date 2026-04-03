'use client';

import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/common/ImageUpload';
import { Trash2, Plus, Info, X, Bold } from 'lucide-react';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { createProduct } from '@/services/productService';

export default function CreateProductPage() {
    const router = useRouter();
    const SUGGESTED_OPTION_NAMES = ["Màu sắc", "Kích thước", "Chất liệu", "Kiểu dáng"];

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

    const [options, setOptions] = useState([]);
    const [skus, setSkus] = useState([]);

    const [bulkProfitMargin, setBulkProfitMargin] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catData, brandData] = await Promise.all([getCategories(), getBrands()]);
                setCategories(catData);
                setBrands(brandData);
            } catch (error) {
                toast.error("Lỗi kết nối dữ liệu danh mục/thương hiệu");
            }
        };
        fetchData();
    }, []);

    const addOption = () => {
        setOptions([...options, { name: 'Màu sắc', values: [] }]);
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

    const generateSkus = (currentOptions) => {
        const validOptions = currentOptions.filter(o => o.values.length > 0);
        if (validOptions.length === 0) { setSkus([]); return; }

        const cartesian = (a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]]);
        const combinations = cartesian(validOptions.map(o => o.values));

        const newSkus = combinations.map((combo, index) => {
            const skuName = combo.join(' - ');
            const existing = skus.find(s => s.name === skuName);
            return {
                code: existing?.code || `SKU-${Date.now()}-${index}`,
                name: skuName,
                stock: existing?.stock || 0,
                profitMargin: existing?.profitMargin || 0,
                optionValues: combo.map((val, idx) => ({
                    optionName: validOptions[idx].name,
                    value: val
                }))
            };
        });
        setSkus(newSkus);
    };

    const applyBulkProfitMargin = () => {
        const margin = parseFloat(bulkProfitMargin);
        if (isNaN(margin) || margin < 0) {
            return toast.warning("Vui lòng nhập tỷ lệ lợi nhuận hợp lệ (>= 0)");
        }
        const updatedSkus = skus.map(sku => ({
            ...sku,
            profitMargin: margin
        }));
        setSkus(updatedSkus);
        toast.success(`Đã áp dụng lợi nhuận ${margin}% cho tất cả biến thể`);
    };

    const handleSubmit = async () => {
        try {
            if (!product.name) return toast.warning("Vui lòng nhập tên sản phẩm!");
            if (!product.categoryId) return toast.warning("Vui lòng chọn danh mục!");
            if (!product.brandId) return toast.warning("Vui lòng chọn thương hiệu!");
            if (options.length === 0) return toast.warning("Vui lòng thêm ít nhất 1 nhóm phân loại!");
            if (skus.length === 0) return toast.warning("Vui lòng tạo các phiên bản (SKU)!");

            const payload = {
                ...product,
                basePrice: 0, // Giá bán sẽ được tính sau khi nhập hàng
                options: options.map(opt => ({
                    name: opt.name,
                    values: opt.values.map(val => ({ value: val }))
                })),
                skus: skus.map(s => ({
                    code: s.code,
                    price: 0,         // Giá bán = 0 khi tạo mới, sẽ được tính sau khi nhập hàng
                    importPrice: 0,   // Giá nhập = 0 ban đầu
                    stockQuantity: s.stock,
                    profitMargin: s.profitMargin || 0,
                    optionValues: s.optionValues
                }))
            };

            const loadingToast = toast.loading("Đang tạo sản phẩm...");
            await createProduct(payload);
            toast.dismiss(loadingToast);
            toast.success("🎉 Tạo sản phẩm thành công! Vào mục Nhập kho để nhập giá và số lượng.");
            setTimeout(() => router.push('/admin/products'), 500);
        } catch (error) {
            toast.dismiss();
            toast.error(`Thất bại: ${error.response?.data?.message || "Lỗi khi tạo sản phẩm"}`);
        }
    };

    return (
        <div className="p-2 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-center items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Thêm sản phẩm mới</h1>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3 text-md text-blue-800">
                <Info size={22} className="shrink-0 mt-0.5 text-blue-600" />
                <div>
                    <strong>Quy trình mới:</strong> Khi tạo sản phẩm, bạn chỉ cần nhập thông tin và các phân loại (biến thể).
                    <br />Giá nhập và giá bán sẽ được tính tự động khi bạn <strong>tạo phiếu nhập kho</strong> cho sản phẩm này.
                    Giá bán = Giá nhập bình quân × (100% + Tỷ lệ lợi nhuận).
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CỘT TRÁI */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thông tin cơ bản */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Thông tin cơ bản</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-md font-medium mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={product.name}
                                    onChange={e => setProduct({ ...product, name: e.target.value })}
                                    placeholder="VD: Áo Thun Polo Premium"
                                />
                            </div>
                            <div>
                                <label className="block text-md font-medium mb-1">Mô tả chi tiết</label>
                                <textarea
                                    className="w-full border border-gray-300 p-2 rounded h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={product.description}
                                    onChange={e => setProduct({ ...product, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Phân loại & Biến thể */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="font-bold text-gray-800">Phân loại hàng</h2>
                            <button onClick={addOption} className="text-blue-600 text-md font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded">
                                <Plus size={22} /> Thêm nhóm phân loại
                            </button>
                        </div>

                        <div className="space-y-4">
                            {options.map((opt, optIdx) => (
                                <div key={optIdx} className="bg-gray-50 p-4 rounded-lg border relative">
                                    <button onClick={() => removeOption(optIdx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                                        <Trash2 size={22} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-4">
                                            <label className="text-sm font-semibold text-gray-500 uppercase mb-1 block">Tên nhóm <span className="text-red-500">*</span></label>
                                            <select
                                                className="w-full border border-gray-300 p-2 rounded focus:border-blue-500 outline-none bg-white"
                                                value={opt.name}
                                                onChange={e => updateOptionName(optIdx, e.target.value)}
                                            >
                                                <option value="">-- Chọn tên nhóm --</option>
                                                {SUGGESTED_OPTION_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-8">
                                            <label className="text-sm font-semibold text-gray-500 uppercase mb-1 block">Giá trị (Enter để thêm)</label>
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
                                                    <span key={valIdx} className="bg-white border px-3 py-1 text-md rounded-full flex items-center gap-2 shadow-sm">
                                                        {val}
                                                        <button onClick={() => removeOptionValue(optIdx, valIdx)} className="text-red-400 hover:text-red-600 font-bold text-md px-1.5">
                                                            <X size={18} fontWeight={Bold} className="shrink-0 text-red-600 hover:text-red-800" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SKU preview table - chỉ hiển thị tên và số lượng ban đầu */}
                        {skus.length > 0 && (
                            <div className="mt-6 border-t pt-4">
                                <div className="flex justify-between items-end mb-3">
                                    <p className="text-md font-bold text-gray-700">Danh sách biến thể sẽ được tạo:</p>

                                    {/* UI: Set lợi nhuận hàng loạt */}
                                    <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-100">
                                        <label className="text-sm font-semibold text-blue-800">Set lợi nhuận chung (%):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 border-gray-300 rounded p-1 text-md outline-none focus:border-blue-500"
                                            value={bulkProfitMargin}
                                            onChange={(e) => setBulkProfitMargin(e.target.value)}
                                            placeholder="VD: 30"
                                        />
                                        <button
                                            onClick={applyBulkProfitMargin}
                                            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-md text-left">
                                        <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                                            <tr>
                                                <th className="p-3">Phiên bản</th>
                                                <th className="p-3 w-40">Mã SKU</th>
                                                <th className="p-3 w-32 text-center">Tồn kho đầu</th>
                                                <th className="p-3 w-32 text-center">Lợi nhuận (%)</th>
                                                <th className="p-3 text-gray-400 text-sm">Giá nhập / Bán</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {skus.map((sku, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium text-gray-800">{sku.name}</td>
                                                    <td className="p-3">
                                                        <input type="text" className="border border-gray-300 p-1.5 w-full rounded text-sm font-mono outline-none focus:border-blue-500"
                                                            value={sku.code}
                                                            onChange={e => { const s = [...skus]; s[idx].code = e.target.value; setSkus(s); }} />
                                                    </td>
                                                    <td className="p-3">
                                                        <input type="number" min="0" className="border border-gray-300 p-1.5 w-full rounded text-center outline-none focus:border-blue-500"
                                                            value={sku.stock}
                                                            onChange={e => { const s = [...skus]; s[idx].stock = parseInt(e.target.value) || 0; setSkus(s); }} />
                                                    </td>
                                                    <td className="p-3">
                                                        {/* UI: Cột nhập lợi nhuận cho từng SKU */}
                                                        <input type="number" min="0" className="border border-gray-300 p-1.5 w-full rounded text-center outline-none focus:border-blue-500 font-semibold text-green-600"
                                                            value={sku.profitMargin}
                                                            onChange={e => { const s = [...skus]; s[idx].profitMargin = parseFloat(e.target.value) || 0; setSkus(s); }} />
                                                    </td>
                                                    <td className="p-3 text-gray-400 text-sm italic">Sẽ cập nhật khi nhập hàng</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4">Hình ảnh đại diện</h2>
                        <ImageUpload onUpload={(url) => setProduct({ ...product, thumbnail: url })} currentImage={product.thumbnail} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4">Phân loại</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-md font-medium mb-1">Danh mục <span className="text-red-500">*</span></label>
                                <select className="w-full border border-gray-300 p-2 rounded" onChange={e => setProduct({ ...product, categoryId: e.target.value })}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-md font-medium mb-1">Thương hiệu <span className="text-red-500">*</span></label>
                                <select className="w-full border border-gray-300 p-2 rounded" onChange={e => setProduct({ ...product, brandId: e.target.value })}>
                                    <option value="">-- Chọn thương hiệu --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSubmit} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow cursor-pointer">
                        TẠO SẢN PHẨM
                    </button>
                </div>
            </div>
        </div>
    );
}