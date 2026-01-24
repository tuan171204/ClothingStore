"use client"; // Bắt buộc, vì có useState, onClick

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Heart, Share2 } from 'lucide-react';
import { formatCurrency } from '@/services/productService';

const ProductDetail = ({ product }) => {
    // 1. State lưu các lựa chọn của user (VD: { "Màu sắc": "Đỏ", "Kích thước": "M" })
    const [selections, setSelections] = useState({});

    // 2. State lưu SKU hiện tại đang khớp
    const [currentSku, setCurrentSku] = useState(null);

    // 3. Khởi tạo mặc định: Chọn option đầu tiên của mỗi loại cho user đỡ phải click
    useEffect(() => {
        if (product.options) {
            const defaults = {};
            product.options.forEach(opt => {
                // Mặc định chọn giá trị đầu tiên (VD: Màu Đỏ, Size M)
                if (opt.values.length > 0) {
                    defaults[opt.name] = opt.values[0].value;
                }
            });
            setSelections(defaults);
        }
    }, [product]);

    // 4. Logic "AJAX": Tự động tìm SKU khi selections thay đổi
    useEffect(() => {
        if (!product.skus) return;

        // Tìm SKU nào mà tên của nó chứa tất cả các giá trị đang chọn
        // (Cách này hơi "lười" dựa trên skuName "Đỏ - M", cách chuẩn hơn là so sánh ID như Backend)
        // Nhưng vì Frontend ta đang có skuName chuẩn rồi, dùng luôn cho nhanh.

        const foundSku = product.skus.find(sku => {
            const selectedValues = Object.values(selections);
            // Kiểm tra xem skuName (VD: "Đỏ - M") có chứa các từ khóa đã chọn không
            // Lưu ý: Logic này chỉ đúng nếu skuName được tạo chuẩn từ Backend
            return selectedValues.every(val => sku.skuName.includes(val));
        });

        setCurrentSku(foundSku || null);
    }, [selections, product.skus]);

    // Hàm xử lý khi user click chọn Option
    const handleSelect = (optionName, value) => {
        setSelections(prev => ({ ...prev, [optionName]: value }));
    };

    // Xác định giá và tồn kho để hiển thị
    const displayPrice = currentSku ? currentSku.price : product.basePrice;
    const displayStock = currentSku ? currentSku.stockQuantity : 0;
    const isOutOfStock = displayStock === 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* --- CỘT TRÁI: ẢNH SẢN PHẨM --- */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-square relative flex items-center justify-center bg-gray-50">
                    {/* Sau này thay bằng product.images slider */}
                    {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400 text-xl">No Image</span>
                    )}
                </div>
            </div>

            {/* --- CỘT PHẢI: THÔNG TIN & CHỌN BIẾN THỂ --- */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-2xl font-bold text-red-600">
                            {formatCurrency(displayPrice)}
                        </span>
                        {currentSku && (
                            <span className={`text-sm px-2 py-1 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {isOutOfStock ? 'Hết hàng' : `Còn ${displayStock} sản phẩm`}
                            </span>
                        )}
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* --- KHU VỰC CHỌN OPTION (Màu, Size) --- */}
                {product.options && product.options.map((option) => (
                    <div key={option.id}>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">{option.name}</h3>
                        <div className="flex flex-wrap gap-3">
                            {option.values.map((val) => {
                                const isSelected = selections[option.name] === val.value;
                                return (
                                    <button
                                        key={val.id}
                                        onClick={() => handleSelect(option.name, val.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border
                                            ${isSelected
                                                ? 'border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-600'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {val.value}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {/* --- NÚT MUA HÀNG --- */}
                <div className="flex gap-4 pt-4">
                    <button
                        disabled={!currentSku || isOutOfStock}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all
                            ${!currentSku || isOutOfStock
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                            }
                        `}
                    >
                        <ShoppingCart size={20} />
                        {isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                    </button>

                    <button className="p-4 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
                        <Heart size={20} />
                    </button>
                </div>

                {/* --- MÔ TẢ NGẮN --- */}
                <div className="prose prose-sm text-gray-500 mt-6">
                    <p>{product.description}</p>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;