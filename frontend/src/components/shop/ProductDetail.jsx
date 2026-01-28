"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Plus, Minus } from 'lucide-react'; // Import thêm icon Plus, Minus
import { formatCurrency } from '@/services/productService';
import { useCart } from "@/context/CartContext"; // Import Context

const ProductDetail = ({ product }) => {
    const { addToCart } = useCart();

    // 1. State lựa chọn phân loại
    const [selections, setSelections] = useState({});

    // 2. State SKU hiện tại
    const [currentSku, setCurrentSku] = useState(null);

    // 3. State số lượng mua (Mặc định là 1)
    const [quantity, setQuantity] = useState(1);

    // -- Logic khởi tạo mặc định (Giữ nguyên) --
    useEffect(() => {
        if (product.options) {
            const defaults = {};
            product.options.forEach(opt => {
                if (opt.values.length > 0) {
                    defaults[opt.name] = opt.values[0].value;
                }
            });
            setSelections(defaults);
        }
    }, [product]);

    // -- Logic tìm SKU (Giữ nguyên) --
    useEffect(() => {
        if (!product.skus) return;
        const sku = product.skus.find(s => {
            const variantParts = s.skuName.split(' - ');
            return Object.values(selections).every(val => variantParts.includes(val));
        });
        setCurrentSku(sku || null);
    }, [selections, product]);

    // -- Logic mới: Reset hoặc Clamp số lượng khi đổi SKU --
    useEffect(() => {
        if (currentSku) {
            // Nếu số lượng đang chọn > tồn kho -> Giảm xuống bằng tồn kho
            if (quantity > currentSku.stockQuantity) {
                setQuantity(currentSku.stockQuantity > 0 ? currentSku.stockQuantity : 1);
            }
        }
    }, [currentSku, quantity]);

    const handleSelectionChange = (optionName, value) => {
        setSelections(prev => ({ ...prev, [optionName]: value }));
    };

    // -- Hàm xử lý tăng giảm số lượng --
    const handleQuantityChange = (type) => {
        if (!currentSku) return;

        if (type === 'decrease') {
            if (quantity > 1) setQuantity(quantity - 1);
        } else {
            // Kiểm tra tồn kho trước khi tăng
            if (quantity < currentSku.stockQuantity) {
                setQuantity(quantity + 1);
            } else {
                alert(`Kho chỉ còn ${currentSku.stockQuantity} sản phẩm!`);
            }
        }
    };

    // -- Hàm xử lý nhập số trực tiếp --
    const handleInputChange = (e) => {
        const val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) {
            setQuantity(1);
        } else if (currentSku && val > currentSku.stockQuantity) {
            setQuantity(currentSku.stockQuantity);
        } else {
            setQuantity(val);
        }
    };

    const handleAddToCart = () => {
        if (!currentSku) {
            alert("Vui lòng chọn đầy đủ phân loại hàng");
            return;
        }
        // Gọi hàm từ Context với số lượng quantity đã chọn
        addToCart(product, currentSku, quantity);
    };

    // Kiểm tra trạng thái hết hàng
    const isOutOfStock = !currentSku || currentSku.stockQuantity === 0;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
            {/* Cột Trái: Ảnh sản phẩm */}
            <div className="w-full md:w-1/2">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group">
                    <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
            </div>

            {/* Cột Phải: Thông tin & Thao tác */}
            <div className="flex-1 flex flex-col">
                <div className="mb-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
                    {product.brandName}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                {/* Giá tiền: Hiển thị giá SKU nếu có, không thì giá gốc */}
                <div className="text-3xl font-bold text-red-600 mb-6">
                    {currentSku ? formatCurrency(currentSku.price) : formatCurrency(product.basePrice)}
                </div>

                {/* --- OPTIONS (Màu, Size) --- */}
                {product.options && product.options.map((opt) => (
                    <div key={opt.id} className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {opt.name}: <span className="text-blue-600 font-bold">{selections[opt.name]}</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {opt.values.map((val) => {
                                const isSelected = selections[opt.name] === val.value;
                                return (
                                    <button
                                        key={val.id}
                                        onClick={() => handleSelectionChange(opt.name, val.value)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                                            ${isSelected
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
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

                <hr className="border-gray-100 my-4" />

                {/* --- KHU VỰC SỐ LƯỢNG & NÚT MUA --- */}
                <div className="flex flex-col gap-4">
                    {/* Hàng 1: Số lượng tồn kho & Bộ chọn số lượng */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            {isOutOfStock ? (
                                <span className="text-red-500 font-bold">Hết hàng</span>
                            ) : (
                                <span>Còn lại: <span className="font-bold text-gray-900">{currentSku?.stockQuantity}</span> sản phẩm</span>
                            )}
                        </span>
                    </div>

                    <div className="flex gap-4">
                        {/* Bộ chọn số lượng */}
                        <div className="flex items-center border border-gray-300 rounded-xl h-14 w-32 shrink-0">
                            <button
                                onClick={() => handleQuantityChange('decrease')}
                                disabled={isOutOfStock || quantity <= 1}
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50 rounded-l-xl"
                            >
                                <Minus size={18} />
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={handleInputChange}
                                disabled={isOutOfStock}
                                className="w-full h-full text-center font-bold text-gray-800 focus:outline-none bg-transparent" // type number để hiện bàn phím số trên mobile
                            />
                            <button
                                onClick={() => handleQuantityChange('increase')}
                                disabled={isOutOfStock || (currentSku && quantity >= currentSku.stockQuantity)}
                                className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50 rounded-r-xl"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Nút Thêm vào giỏ */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-bold text-white text-lg transition-all cursor-pointer
                                ${isOutOfStock
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]'
                                }
                            `}
                        >
                            <ShoppingCart size={22} />
                            {isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                        </button>

                        <button className="h-14 w-14 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
                            <Heart size={22} />
                        </button>
                    </div>
                </div>

                {/* --- MÔ TẢ --- */}
                <div className="prose prose-sm text-gray-500 mt-8 bg-gray-50 p-4 rounded-xl">
                    <h4 className="text-gray-900 font-bold mb-2">Mô tả sản phẩm</h4>
                    <p>{product.description}</p>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;