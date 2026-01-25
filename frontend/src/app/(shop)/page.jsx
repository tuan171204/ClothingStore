// src/app/(shop)/page.jsx
import ProductCard from '@/components/shop/ProductCard';
import { getProducts } from '@/services/productService';
import React from 'react';

export default async function HomePage() {
    const products = await getProducts();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Banner Quảng cáo (HTML tĩnh) */}
            <section className="mb-12 bg-blue-600 rounded-2xl p-10 text-white text-center">
                <h1 className="text-4xl font-bold mb-4">Chào mừng đến với ClothStore</h1>
                <p className="text-lg opacity-90">Săn sale quần áo chất lượng cao ngay hôm nay!</p>
            </section>

            {/* Danh sách Sản phẩm */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Sản phẩm mới nhất</h2>
                    <a href="/products" className="text-blue-600 hover:underline">Xem tất cả &rarr;</a>
                </div>

                {/* Grid Layout: Mobile 1 cột, Tablet 2 cột, Desktop 4 cột */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="text-center col-span-4 text-gray-500">
                            Chưa có sản phẩm nào. Hãy chạy DataSeeder ở Backend nhé!
                        </p>
                    )}
                </div>
            </section>
        </div>
    );

}