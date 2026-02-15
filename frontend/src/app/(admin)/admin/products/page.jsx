'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { formatCurrency } from '@/services/productService';

export default function AdminProductPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/products');
            setProducts(res.data);
        } catch (error) {
            toast.error("Lỗi tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await axios.delete(`/products/${id}`);
            toast.success("Đã xóa sản phẩm");
            fetchProducts();
        } catch (error) {
            toast.error("Không thể xóa sản phẩm này (Có thể do đang có đơn hàng)");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Sản phẩm</h1>
                <Link href="/admin/products/create" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={18} /> Thêm mới
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full border-collapse font-sans text-center">
                    <thead className="bg-gray-50 text-gray-600 text-md uppercase">
                        <tr>
                            <th className="p-4 border-b">ID</th>
                            <th className="p-4 border-b">Ảnh</th>
                            <th className="p-4 border-b">Tên sản phẩm</th>
                            <th className="p-4 border-b">Danh mục</th>
                            <th className="p-4 border-b">Thương hiệu</th>
                            <th className="p-4 border-b">Giá gốc</th>
                            <th className="p-4 border-b">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="p-2 border-b text-gray-500">#{product.id}</td>
                                <td className="p-2 border-b flex justify-center">
                                    <img src={product.thumbnail || '/placeholder.jpg'} alt="" className="w-[125] h-[100] object-cover rounded border" />
                                </td>
                                <td className="p-2 border-b font-medium">{product.name}</td>
                                <td className="p-2 border-b">{product.categoryName}</td>
                                <td className="p-2 border-b">{product.brandName}</td>
                                <td className="p-2 border-b text-blue-600">
                                    {formatCurrency(product.basePrice)}
                                </td>
                                <td className="p-2 border-b">
                                    <div className="flex gap-3 justify-center">
                                        {/* Nút Xem chi tiết (Mở tab mới sang trang Shop) */}
                                        <Link
                                            href={`/admin/products/${product.id}`} // Trỏ về trang Admin Detail mới
                                            className="text-white bg-green-600 hover:bg-green-800 cursor-pointer p-4 rounded-lg transition-colors"
                                            title="Xem chi tiết quản trị"
                                        >
                                            <Eye size={18} />
                                        </Link>

                                        {/* Nút Sửa (Chuyển sang trang Edit Admin - Sẽ làm sau) */}
                                        <Link
                                            href={`/admin/products/edit/${product.id}`}
                                            className="text-black bg-amber-400 hover:bg-amber-600 cursor-pointer p-4 rounded-lg transition-colors"
                                            title="Sửa sản phẩm"
                                        >
                                            <Edit size={18} />
                                        </Link>

                                        {/* Nút Xóa */}
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-white bg-red-600 hover:bg-red-800 cursor-pointer p-4 rounded-lg transition-colors"
                                            title="Xóa sản phẩm"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">Chưa có sản phẩm nào</div>
                )}
            </div>
        </div>
    );
}