import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/services/productService";
import { ShoppingBag } from "lucide-react"; // Dùng túi xách (ShoppingBag) sang hơn xe đẩy (ShoppingCart)

const ProductCard = ({ product }) => {

    const renderPrice = () => {
        // 1. Trường hợp không có dữ liệu khoảng giá
        if (!product.minPrice || !product.maxPrice) {
            return (
                <span className="text-lg font-black text-gray-900 tracking-tight">
                    {formatCurrency(product.basePrice)}
                </span>
            );
        }

        // 2. Trường hợp tất cả biến thể đồng giá
        if (product.minPrice === product.maxPrice) {
            return (
                <span className="text-lg font-black text-gray-900 tracking-tight">
                    {formatCurrency(product.minPrice)}
                </span>
            );
        }

        // 3. Trường hợp có khoảng giá (Nổi bật nhưng không lố)
        return (
            <div className="flex items-center justify-center gap-2">
                <span className="text-md font-bold text-gray-400">từ</span>
                <span className="text-lg font-black text-red-600 tracking-tighter">
                    {formatCurrency(product.minPrice)}
                </span>
                <span className="text-gray-500 mx-0.5">--</span>
                <span className="text-lg font-black text-red-600 tracking-tighter">
                    {formatCurrency(product.maxPrice)}
                </span>
            </div>
        );
    };

    return (
        <div className="group flex flex-col bg-white">

            {/* 1. Phần Ảnh (Khung vuông vức, tỷ lệ 3:4) */}
            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden w-full mb-4">
                <Link href={`/products/${product.id}`}>
                    <img
                        src={product.thumbnail || 'https://placehold.co/400x533?text=No+Image'}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                </Link>

                {/* Badge (Nhãn) góc trái - Tone đen trắng mạnh mẽ */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {/* Giả sử bạn có cờ isNew hoặc giảm giá, render ra đây */}
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                        NEW
                    </span>
                </div>

                {/* Nút Quick Add ẩn đi, chỉ hiện khi Hover chuột vào ảnh */}
                <div className="absolute bottom-0 left-0 w-full p-8 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <Link href={`/products/${product.id}`} className="w-full bg-white text-black py-3 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex justify-center items-center gap-2 shadow-lg cursor-pointer border border-gray-100">
                        <ShoppingBag size={18} /> Xem Chi Tiết
                    </Link>
                </div>
            </div>

            {/* 2. Phần Thông tin (Căn giữa, Monochrome) */}
            <div className="flex flex-col text-center px-2 py-2">
                {/* Brand Name - Nhỏ và thanh thoát */}
                <span className="text-md text-gray-500 uppercase tracking-[0.2em] mb-1 font-semibold">
                    {product.brandName || 'Local Brand'}
                </span>

                {/* Product Name - Line-clamp để giữ layout đều */}
                <Link href={`/products/${product.id}`}>
                    <h3 className="text-md font-bold text-gray-900 mb-3 hover:text-black transition-all line-clamp-1 uppercase tracking-wide">
                        {product.name}
                    </h3>
                </Link>

                {/* Price Area - Tâm điểm của sự chú ý */}
                <div className="py-1 border-t border-gray-50">
                    {renderPrice()}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;