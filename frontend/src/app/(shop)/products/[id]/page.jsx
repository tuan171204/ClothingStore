import React from 'react';
import { getProductById } from '@/services/productService';
import ProductDetail from '@/components/shop/ProductDetail';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Hàm này chạy trên Server Next.js
export default async function ProductPage({ params }) {
    // Lấy ID từ URL (params.id)
    const { id } = await params; // Phải await params trước
    const product = await getProductById(id);

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <h1 className="text-2xl text-gray-500">Không tìm thấy sản phẩm :(</h1>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb (Điều hướng) */}
            <nav className="flex items-center text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
                <ChevronRight size={16} className="mx-2" />
                <Link href="/" prefetch={false} className="hover:text-blue-600">Sản phẩm</Link>
                <ChevronRight size={16} className="mx-2" />
                <span className="text-gray-900 font-medium truncate">{product.name}</span>
            </nav>

            {/* Client Component xử lý tương tác */}
            <ProductDetail product={product} />
        </div>
    );
}