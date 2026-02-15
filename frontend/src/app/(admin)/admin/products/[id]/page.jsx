'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { formatCurrency } from '@/services/productService';
import { Edit, Trash2, ArrowLeft, Package, DollarSign, TrendingUp, BarChart3, Globe } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function AdminProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Load dữ liệu sản phẩm
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`/products/${id}`);
                setProduct(res.data);
            } catch (error) {
                console.error("Lỗi:", error);
                toast.error("Không tìm thấy sản phẩm");
                router.push('/admin/products');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id, router]);

    // 2. Xử lý xóa (Nếu muốn xóa luôn từ trang chi tiết)
    const handleDelete = async () => {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await axios.delete(`/products/${id}`);
            toast.success("Đã xóa sản phẩm");
            router.push('/admin/products');
        } catch (error) {
            toast.error("Lỗi khi xóa (Có thể do đang có đơn hàng)");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu quản trị...</div>;
    if (!product) return null;

    // Tính toán nhanh chỉ số (Metrics)
    const totalStock = product.skus?.reduce((sum, sku) => sum + (sku.stockQuantity || 0), 0) || 0;
    const variantCount = product.skus?.length || 0;
    // Lấy khoảng giá (Min - Max)
    const prices = product.skus?.map(s => s.price) || [product.basePrice];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {product.name}
                            {/* Badge trạng thái (Giả định active = true) */}
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                Đang kinh doanh
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500">
                            Mã SP: <span className="font-mono font-bold text-gray-700">#{product.id}</span>
                            {' • '} Danh mục: <span className="font-medium text-blue-600">{product.categoryName}</span>
                            {' • '} Thương hiệu: <span className="font-medium text-blue-600">{product.brandName}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {/* Nút xem phía Khách hàng */}
                    <Link
                        href={`/products/${product.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        title="Xem hiển thị ngoài trang Shop"
                    >
                        <Globe size={18} /> Xem Shop
                    </Link>

                    {/* Nút Sửa */}
                    <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                    >
                        <Edit size={18} /> Chỉnh sửa
                    </Link>

                    {/* Nút Xóa */}
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* --- METRICS CARDS (Thống kê nhanh) --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Tổng tồn kho</p>
                        <p className="text-2xl font-bold text-gray-800">{totalStock}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Số phiên bản</p>
                        <p className="text-2xl font-bold text-gray-800">{variantCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Khoảng giá bán</p>
                        <p className="text-lg font-bold text-gray-800">
                            {formatCurrency(minPrice)}
                            {minPrice !== maxPrice && ` - ${formatCurrency(maxPrice)}`}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 opacity-70">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><BarChart3 size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Doanh thu (Demo)</p>
                        <p className="text-2xl font-bold text-gray-800">0 đ</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- CỘT TRÁI: DANH SÁCH BIẾN THỂ (Quan trọng nhất) --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-800">Chi tiết Biến thể (SKU)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Mã SKU</th>
                                        <th className="px-6 py-3">Thuộc tính</th>
                                        <th className="px-6 py-3 text-right">Giá Nhập</th>
                                        <th className="px-6 py-3 text-right">Giá Bán</th>
                                        <th className="px-6 py-3 text-center">Tồn kho</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {product.skus?.map((sku) => (
                                        <tr key={sku.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                                                {sku.code}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">
                                                {sku.skuName || '---'}
                                            </td>
                                            {/* Cột Giá Nhập: Chỉ Admin thấy */}
                                            <td className="px-6 py-4 text-right text-gray-500">
                                                {sku.importPrice ? formatCurrency(sku.importPrice) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                {formatCurrency(sku.price)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${sku.stockQuantity > 10 ? 'bg-green-50 text-green-700 border-green-200' :
                                                        sku.stockQuantity > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {sku.stockQuantity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- PLACEHOLDER: BIỂU ĐỒ LỊCH SỬ --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-gray-800">Lịch sử biến động giá & Lợi nhuận</h2>
                            <span className="text-xs text-gray-400 border px-2 py-1 rounded">Last 30 days</span>
                        </div>

                        {/* Biểu đồ giả lập (CSS only) */}
                        <div className="h-64 w-full flex items-end justify-between gap-2 px-4 opacity-40 group-hover:opacity-60 transition-opacity">
                            {[35, 45, 30, 60, 55, 70, 65, 80, 75, 50, 60, 90].map((h, i) => (
                                <div key={i} className="w-full bg-blue-500 rounded-t-sm relative group/bar" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                        {h * 10}.000đ
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow border text-sm font-medium text-gray-600">
                                🚀 Tính năng sắp triển khai (Phase 2)
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: THÔNG TIN CƠ BẢN --- */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide text-gray-500">Ảnh đại diện</h2>
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <img
                                src={product.thumbnail || "/placeholder.jpg"}
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide text-gray-500">Mô tả sản phẩm</h2>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100 max-h-96 overflow-y-auto">
                            {product.description || "Chưa có mô tả."}
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 text-center">
                        Created at: {product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : '---'}
                    </div>
                </div>
            </div>
        </div>
    );
}