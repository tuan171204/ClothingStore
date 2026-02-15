'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';
import { getProductById, updateProduct, formatCurrency } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';

export default function EditProductPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);

    // --- STATE ---
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [product, setProduct] = useState({
        name: '', description: '', categoryId: '', brandId: '', thumbnail: '', basePrice: ''
    });

    const [options, setOptions] = useState([]); // [{name: 'Màu', values: ['Đỏ', 'Xanh']}]
    const [skus, setSkus] = useState([]);

    // --- LOAD DATA ---
    useEffect(() => {
        const initData = async () => {
            try {
                const [pData, cData, bData] = await Promise.all([
                    getProductById(id),
                    getCategories(),
                    getBrands()
                ]);

                if (!pData) {
                    toast.error("Không tìm thấy sản phẩm");
                    return router.push('/admin/products');
                }

                setCategories(cData);
                setBrands(bData);

                // 1. Map Product Info
                setProduct({
                    name: pData.name,
                    description: pData.description,
                    thumbnail: pData.thumbnail,
                    basePrice: pData.basePrice,
                    categoryId: pData.categoryName ? cData.find(c => c.name === pData.categoryName)?.id : '',
                    brandId: pData.brandName ? bData.find(b => b.name === pData.brandName)?.id : ''
                    // Lưu ý: Logic tìm ID từ Name ở trên chỉ là tương đối, tốt nhất API getProductById nên trả về categoryId và brandId luôn.
                    // Nếu API hiện tại của bạn chưa trả về categoryId/brandId, dropdown sẽ không tự chọn được.
                    // Tạm thời bạn cứ để vậy, nếu dropdown không hiện đúng thì ta sẽ sửa Backend thêm field ID sau.
                });

                // 2. Map Options (Quan trọng)
                // API trả về: options: [{ name: "Màu", values: [{id: 1, value: "Đỏ"}] }]
                if (pData.options) {
                    const mappedOpts = pData.options.map(opt => ({
                        name: opt.name,
                        values: opt.values.map(v => v.value) // Chỉ lấy value string
                    }));
                    setOptions(mappedOpts);
                }

                // 3. Map SKUs
                if (pData.skus) {
                    const mappedSkus = pData.skus.map(s => ({
                        code: s.code,
                        name: s.skuName,
                        price: s.price,
                        importPrice: s.importPrice || 0,
                        stock: s.stockQuantity,
                        optionValues: s.optionValues
                    }));
                    setSkus(mappedSkus);
                }

            } catch (error) {
                console.error(error);
                toast.error("Lỗi tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, [id, router]);

    // --- HANDLERS ---
    const handleSkuChange = (index, field, value) => {
        const newSkus = [...skus];
        newSkus[index][field] = value;
        setSkus(newSkus);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...product,
                categoryId: product.categoryId || null, // Đảm bảo không gửi chuỗi rỗng
                brandId: product.brandId || null,
                // Gửi kèm SKUs để update giá
                skus: skus.map(s => ({
                    code: s.code,
                    price: s.price,
                    importPrice: s.importPrice,
                    stockQuantity: s.stock
                    // Không cần gửi optionValues khi update
                }))
            };

            await updateProduct(id, payload);
            toast.success("Cập nhật thành công!");
            router.push('/admin/products');
        } catch (error) {
            toast.error("Cập nhật thất bại");
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa sản phẩm #{id}</h1>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CỘT TRÁI */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thông tin chung */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Thông tin cơ bản</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={product.name}
                                    onChange={e => setProduct({ ...product, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <textarea
                                    className="w-full border p-2 rounded h-24"
                                    value={product.description}
                                    onChange={e => setProduct({ ...product, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Danh sách SKU (Chỉ cho sửa Giá/Kho) */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4">Quản lý phiên bản (SKU)</h2>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Phiên bản</th>
                                        <th className="p-3 w-32">Giá Nhập</th>
                                        <th className="p-3 w-32">Giá Bán</th>
                                        <th className="p-3 w-24">Kho</th>
                                        <th className="p-3">Mã SKU</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {skus.map((sku, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{sku.name}</td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    className="border border-gray-300 p-1.5 w-full rounded"
                                                    value={sku.importPrice}
                                                    onChange={e => handleSkuChange(idx, 'importPrice', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    className="border border-blue-300 bg-blue-50 text-blue-700 font-bold p-1.5 w-full rounded"
                                                    value={sku.price}
                                                    onChange={e => handleSkuChange(idx, 'price', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    className="border border-gray-300 p-1.5 w-full rounded text-center"
                                                    value={sku.stock}
                                                    onChange={e => handleSkuChange(idx, 'stock', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-3 text-xs text-gray-400 font-mono">{sku.code}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-orange-500 mt-2 italic">
                            * Lưu ý: Không thể thay đổi cấu trúc phân loại (Màu/Size) ở đây. Nếu cần thay đổi cấu trúc, vui lòng xóa sản phẩm và tạo lại.
                        </p>
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4">Hình ảnh</h2>
                        <ImageUpload
                            onUpload={(url) => setProduct({ ...product, thumbnail: url })}
                            currentImage={product.thumbnail}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="font-bold text-gray-800 mb-4">Phân loại</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Giá gốc</label>
                                <input
                                    className="w-full border p-2 rounded bg-gray-100"
                                    value={product.basePrice}
                                    readOnly
                                    title="Tự động cập nhật khi tạo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Danh mục</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={product.categoryId || ''}
                                    onChange={e => setProduct({ ...product, categoryId: e.target.value })}
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thương hiệu</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={product.brandId || ''}
                                    onChange={e => setProduct({ ...product, brandId: e.target.value })}
                                >
                                    <option value="">-- Chọn thương hiệu --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm flex justify-center">
                        <button onClick={handleSubmit} className=" w-full bg-amber-400 text-black px-6 py-2 rounded-lg font-bold hover:bg-amber-600 flex items-center gap-2 shadow justify-center cursor-pointer">
                            <Save size={18} /> LƯU THAY ĐỔI
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}