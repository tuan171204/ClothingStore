"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Plus, Minus, Ruler } from 'lucide-react';
import { formatCurrency } from '@/services/productService';
import { useCart } from "@/context/CartContext";
import { toast } from 'react-toastify';

const ProductDetail = ({ product }) => {
    const { addToCart } = useCart();

    const [selections, setSelections] = useState({});
    const [currentSku, setCurrentSku] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isImageLoading, setIsImageLoading] = useState(false); // Hiệu ứng mờ khi chuyển ảnh

    // Khởi tạo lựa chọn mặc định
    useEffect(() => {
        if (product.options && product.options.length > 0) {
            const defaults = {};
            product.options.forEach(opt => {
                // Đảm bảo opt.values tồn tại và là một mảng
                if (opt.values && Array.isArray(opt.values) && opt.values.length > 0) {
                    // Lấy các giá trị chưa bị xóa mềm
                    const activeValues = opt.values.filter(v => v.isActive !== false);

                    if (activeValues.length > 0) {
                        defaults[opt.name] = activeValues[0].value;
                    } else {
                        // Nếu lỡ tất cả đều bị false, vẫn vớt vát lấy cái đầu tiên
                        defaults[opt.name] = opt.values[0].value;
                    }
                }
            });

            console.log("Hàm khởi tạo đã tự động chọn:", defaults);
            setSelections(defaults);
        }
    }, [product]);

    // Tìm Sku khớp với lựa chọn
    useEffect(() => {
        if (!product.skus || product.skus.length === 0) return;

        // --- BỘ CÔNG CỤ DEBUG (Bật F12 -> tab Console để xem) ---
        console.log("========== DEBUG KIỂM TRA PHÂN LOẠI ==========");
        console.log("1. Cấu hình Option:", product.options);
        console.log("2. Khách đang chọn:", selections);

        if (!product.options || product.options.length === 0) {
            const activeSku = product.skus.find(s => s.isActive !== false);
            setCurrentSku(activeSku || product.skus[0]);
            setQuantity(1);
            return;
        }

        const requiredOptionsCount = product.options.length;
        const currentSelectionsCount = Object.keys(selections).length;

        if (currentSelectionsCount < requiredOptionsCount) {
            console.log("-> THẤT BẠI: Chưa chọn đủ. Yêu cầu:", requiredOptionsCount, "Đang có:", currentSelectionsCount);
            setCurrentSku(null);
            return;
        }

        // Tìm SKU khớp
        const sku = product.skus.find(s => {
            if (s.isActive === false) return false;

            const variantValues = s.optionValues?.map(ov => ov.value) || [];

            // Kiểm tra xem các lựa chọn có nằm trong SKU này không
            const isMatch = Object.values(selections).every(val => variantValues.includes(val));

            // In ra quá trình dò tìm để bạn thấy tận mắt
            console.log(`Dò SKU [${s.code || s.skuCode}]: Có chứa ${variantValues.join(', ')} -> Khớp không? ${isMatch}`);

            // CÁCH SỬA DỨT ĐIỂM DỮ LIỆU RÁC: Chỉ cần isMatch là lấy, không ép buộc độ dài (length) nữa
            return isMatch;
        });

        if (sku) {
            console.log("-> THÀNH CÔNG: Đã chốt được SKU:", sku);
        } else {
            console.log("-> THẤT BẠI: Dò hết danh sách nhưng không có SKU nào khớp!");
        }
        console.log("=================================================");

        setCurrentSku(sku || null);
        setQuantity(1);
    }, [selections, product.skus, product.options]);

    const handleSelect = (optionName, value) => {
        setIsImageLoading(true);
        setSelections(prev => ({ ...prev, [optionName]: value }));
        setTimeout(() => setIsImageLoading(false), 300); // Fake load mượt mà
    };

    const handleAddToCart = () => {
        if (!currentSku) return toast.error("Vui lòng chọn đầy đủ phân loại!");
        if (currentSku.stockQuantity < quantity) return toast.error("Kho không đủ hàng!");

        addToCart(product, currentSku, quantity);
        toast.success("Đã thêm vào giỏ hàng!");
    };

    // LOGIC ẢNH: Ưu tiên ảnh của Sku hiện tại -> Ảnh gốc -> Placeholder
    const displayImage = currentSku?.imgUrl || product.thumbnail || 'https://via.placeholder.com/600x800?text=No+Image';
    const isOutOfStock = !currentSku || currentSku.stockQuantity === 0;

    return (
        <div className="flex flex-col md:flex-row gap-12 font-sans mb-20 mt-20 animate-fade-in">
            {/* --- CỘT TRÁI: ẢNH SẢN PHẨM --- */}
            <div className="md:w-1/2">
                <div className="sticky top-24">
                    <div className="relative bg-transparent overflow-hidden w-full group flex justify-center">
                        <img
                            src={displayImage}
                            alt={product.name}
                            className={`w-1/2 h-1/2 object-cover object-center transition-all duration-500 ease-in-out ${isImageLoading ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100'}`}
                        />
                        {/* Nhãn hết hàng nếu có */}
                        {isOutOfStock && (
                            <div className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">
                                Sold Out
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CỘT PHẢI: THÔNG TIN SẢN PHẨM --- */}
            <div className="md:w-1/2 flex flex-col pt-2">

                {/* Brand & Tên */}
                <div className="mb-6">
                    <p className="text-gray-500 text-sm font-semibold tracking-widest uppercase mb-2">{product.brand?.name || 'Local Brand'}</p>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                        {product.name}
                    </h1>
                    <div className="flex items-baseline gap-4">
                        <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(currentSku?.price || product.basePrice)}
                        </span>
                        {/* Nếu có giá gốc/giảm giá thì map vào đây */}
                    </div>
                </div>

                <div className="w-full h-px bg-gray-200 mb-8"></div>

                {/* Các tùy chọn (Options) */}
                <div className="space-y-6 mb-8">
                    {product.options?.map(opt => (
                        <div key={opt.id}>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">{opt.name}</label>
                                {opt.name.toLowerCase().includes('size') && (
                                    <button className="text-xs text-gray-500 hover:text-black flex items-center gap-1 underline transition-colors">
                                        <Ruler size={14} /> Hướng dẫn chọn size
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {opt.values?.map(val => {
                                    if (val.isActive === false) return null; // Ẩn các giá trị đã xóa mềm
                                    const isSelected = selections[opt.name] === val.value;
                                    return (
                                        <button
                                            key={val.id}
                                            onClick={() => handleSelect(opt.name, val.value)}
                                            className={`min-w-[3rem] px-4 py-3 text-sm font-bold border transition-all cursor-pointer
                                                ${isSelected
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'
                                                }
                                            `}
                                        >
                                            {val.value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trạng thái Kho */}
                <div className="mb-8">
                    {currentSku ? (
                        <p className={`text-sm font-medium ${currentSku.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currentSku.stockQuantity > 0 ? `Còn ${currentSku.stockQuantity} sản phẩm sẵn sàng giao` : 'Sản phẩm này hiện đang hết hàng'}
                        </p>
                    ) : (
                        <p className="text-sm text-amber-600 font-medium">Vui lòng chọn đầy đủ phân loại để xem tình trạng kho</p>
                    )}
                </div>

                {/* Khối Action (Số lượng & Nút) */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                    {/* Chỉnh số lượng */}
                    <div className="flex items-center border border-gray-300 h-14 w-full sm:w-36 shrink-0">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-12 h-full flex justify-center items-center text-gray-500 hover:text-black hover:bg-gray-50 transition"
                        >
                            <Minus size={18} />
                        </button>
                        <input
                            type="number"
                            className="w-full h-full text-center font-bold text-gray-900 focus:outline-none bg-transparent"
                            value={quantity}
                            readOnly
                        />
                        <button
                            onClick={() => setQuantity(Math.min(currentSku?.stockQuantity || 1, quantity + 1))}
                            disabled={isOutOfStock}
                            className="w-12 h-full flex justify-center items-center text-gray-500 hover:text-black hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Nút Thêm vào giỏ */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex-1 flex items-center justify-center gap-3 h-14 font-bold text-sm tracking-widest uppercase transition-all cursor-pointer
                            ${isOutOfStock
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-gray-900 text-white hover:bg-black active:scale-[0.98]'
                            }
                        `}
                    >
                        <ShoppingCart size={18} />
                        {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>

                    {/* Nút Yêu thích */}
                    <button className="h-14 w-14 shrink-0 border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors cursor-pointer">
                        <Heart size={20} />
                    </button>
                </div>

                {/* --- MÔ TẢ --- */}
                <div className="border-t border-gray-200 pt-8 mt-auto">
                    <h4 className="text-gray-900 font-bold uppercase tracking-wider mb-4 text-sm">Chi tiết sản phẩm</h4>
                    <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none">
                        <p>{product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetail;