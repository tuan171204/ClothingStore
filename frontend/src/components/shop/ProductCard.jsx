import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/services/productService";
import { ShoppingBag } from "lucide-react"; // Dùng túi xách (ShoppingBag) sang hơn xe đẩy (ShoppingCart)

const ProductCard = ({ product }) => {
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
            <div className="flex flex-col text-center px-2 py-4">
                {/* Brand Name */}
                <span className="text-sm text-gray-500 uppercase tracking-widest mb-1">
                    {product.brand?.name || 'Local Brand'}
                </span>

                {/* Product Name */}
                <Link href={`/products/${product.id}`}>
                    <h3 className="text-md font-bold text-gray-900 mb-2 hover:underline underline-offset-4 transition-all line-clamp-2 uppercase tracking-wide">
                        {product.name}
                    </h3>
                </Link>

                {/* Price */}
                {/* <span className="text-md font-medium text-gray-900">
                    {formatCurrency(product.basePrice)}
                </span> */}
            </div>
        </div>
    );
};

export default ProductCard;