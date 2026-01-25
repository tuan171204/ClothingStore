import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/services/productService";
import { ShoppingCart } from "lucide-react";

const ProductCard = ({ product }) => {
    return (
        <div className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
            {/* 1. Phần Ảnh (Placeholder trước vì chưa có ảnh thật) */}
            <div className="relative h-64 bg-gray-100 w-full overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    {/* Sau này thay bằng thẻ <img src={product.image} /> */}
                    <img src={product.thumbnail} />
                </div>

                {/* Badge giảm giá (Ví dụ) */}
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    HOT
                </span>
            </div>

            {/* 2. Phần Thông tin */}
            <div className="p-4 flex flex-col flex-1">
                <div className="text-xs text-gray-500 mb-1">{product.brandName}</div>

                <Link href={`/products/${product.id}`}>
                    <h3 className="text-gray-800 font-medium text-lg truncate group-hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {/* Hiển thị danh mục */}
                <p className="text-sm text-gray-400 mb-3">{product.categoryName}</p>

                <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-red-600">
                        {formatCurrency(product.basePrice)}
                    </span>

                    <button className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;