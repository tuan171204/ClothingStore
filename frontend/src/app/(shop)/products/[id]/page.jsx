import React from 'react';
import { getProductById, getRelatedProducts } from '@/services/productService';
import ProductDetail from '@/components/shop/ProductDetail';
import ProductCard from '@/components/shop/ProductCard';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Hàm này chạy trên Server Next.js
export default async function ProductPage({ params }) {
    // Lấy ID từ URL (params.id)
    const { id } = await params;

    const [product, relatedProducts] = await Promise.all([
        getProductById(id),
        getRelatedProducts(id)
    ]);

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

            <ProductDetail product={product} />

            {/* Section: Sản phẩm liên quan */}
            {relatedProducts && relatedProducts.length > 0 && (
                <div className="mt-20 border-t border-gray-200 pt-10">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-wider mb-8 text-center">
                        Có thể bạn sẽ thích
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {relatedProducts.map(relProduct => (
                            <ProductCard key={relProduct.id} product={relProduct} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}