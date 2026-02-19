'use client'; // Chuyển thành Client Component để dùng State

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { getProductsWithFilter } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function HomePage() {
    // --- STATE DỮ LIỆU ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // --- STATE PHÂN TRANG ---
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);

    // --- STATE BỘ LỌC ---
    const [filters, setFilters] = useState({
        keyword: '',
        categoryId: '',
        brandId: '',
        minPrice: '',
        maxPrice: ''
    });

    // Tạm lưu giá trị input giá để người dùng gõ xong mới bấm "Áp dụng"
    const [searchInput, setSearchInput] = useState('');
    const [priceInput, setPriceInput] = useState({ min: '', max: '' });

    // 1. Lấy dữ liệu Danh mục & Thương hiệu (Chỉ chạy 1 lần khi load trang)
    useEffect(() => {
        const fetchInitialData = async () => {
            const [catData, brandData] = await Promise.all([
                getCategories(),
                getBrands()
            ]);
            setCategories(catData);
            setBrands(brandData);
        };
        fetchInitialData();
    }, []);

    // 2. Lấy dữ liệu Sản phẩm mỗi khi Filters hoặc Page thay đổi
    useEffect(() => {
        const fetchProducts = async () => {
            // Chuẩn bị params, bỏ qua các giá trị rỗng
            const params = { page, limit: 3 };
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.categoryId) params.categoryId = filters.categoryId;
            if (filters.brandId) params.brandId = filters.brandId;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const data = await getProductsWithFilter(params);
            console.log(data.totalPages)
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        };

        fetchProducts();
    }, [filters, page]); // Dependency array: Lắng nghe sự thay đổi của bộ lọc và trang

    // --- HANDLERS (XỬ LÝ SỰ KIỆN) ---
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0); // Rất quan trọng: Reset về trang 1 mỗi khi đổi bộ lọc
    };

    const applyPriceFilter = () => {
        setFilters(prev => ({
            ...prev,
            minPrice: priceInput.min,
            maxPrice: priceInput.max
        }));
        setPage(0); // Rất quan trọng: Reset về trang 1
    };

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, keyword: searchInput }));
        setPage(0); // Rất quan trọng: Reset về trang 1
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
            // Cuộn lên đầu trang mượt mà sau khi chuyển trang
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Banner Quảng cáo */}
            <section className="mb-8 bg-blue-600 rounded-2xl p-10 text-white text-center shadow-md">
                <h1 className="text-4xl font-bold mb-4">Chào mừng đến với ClothStore</h1>
                <p className="text-lg opacity-90">Săn sale quần áo chất lượng cao ngay hôm nay!</p>
            </section>

            <div className="flex flex-col md:flex-row gap-8">
                {/* ================= SIDEBAR BỘ LỌC ================= */}
                <div className="w-full md:w-1/4 space-y-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-20">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-800">
                            <Filter size={20} className="text-blue-600" /> Bộ lọc tìm kiếm
                        </h3>

                        <div className="mb-6">
                            <h4 className="font-semibold mb-3 text-gray-700 border-b pb-2">Từ khóa</h4>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Tìm tên sản phẩm..."
                                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()} // Gõ Enter để tìm luôn
                                />
                                <button
                                    onClick={handleSearch}
                                    className="bg-blue-600 p-2.5 rounded-lg text-white hover:bg-blue-700 transition-colors shadow-sm"
                                    title="Tìm kiếm"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Block: Danh mục */}
                        <div className="mb-6">
                            <h4 className="font-semibold mb-3 text-gray-700 border-b pb-2">Danh mục</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="radio" name="category" checked={filters.categoryId === ''} onChange={() => handleFilterChange('categoryId', '')} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-gray-600 group-hover:text-blue-600 transition-colors">Tất cả danh mục</span>
                                </label>
                                {categories.map(c => (
                                    <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="category" checked={filters.categoryId === String(c.id)} onChange={() => handleFilterChange('categoryId', String(c.id))} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                        <span className="text-gray-600 group-hover:text-blue-600 transition-colors">{c.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Block: Thương hiệu */}
                        <div className="mb-6">
                            <h4 className="font-semibold mb-3 text-gray-700 border-b pb-2">Thương hiệu</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="radio" name="brand" checked={filters.brandId === ''} onChange={() => handleFilterChange('brandId', '')} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-gray-600 group-hover:text-blue-600 transition-colors">Tất cả thương hiệu</span>
                                </label>
                                {brands.map(b => (
                                    <label key={b.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="brand" checked={filters.brandId === String(b.id)} onChange={() => handleFilterChange('brandId', String(b.id))} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                        <span className="text-gray-600 group-hover:text-blue-600 transition-colors">{b.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Block: Khoảng giá */}
                        <div>
                            <h4 className="font-semibold mb-3 text-gray-700 border-b pb-2">Khoảng giá (VND)</h4>
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="number" placeholder="TỪ" min="0"
                                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                    value={priceInput.min} onChange={e => setPriceInput({ ...priceInput, min: e.target.value })}
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number" placeholder="ĐẾN" min="0"
                                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                    value={priceInput.max} onChange={e => setPriceInput({ ...priceInput, max: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={applyPriceFilter}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                ÁP DỤNG
                            </button>
                        </div>
                    </div>
                </div>

                {/* ================= MAIN CONTENT ================= */}
                <div className="w-full md:w-3/4">
                    <div className="mb-6 flex justify-between items-center border-b pb-4">
                        <h2 className="text-xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                            Tìm thấy <strong className="text-blue-600">{totalElements}</strong> sản phẩm
                        </div>
                    </div>

                    {/* Lưới sản phẩm */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-2">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
                                <button onClick={() => { setFilters({ categoryId: '', brandId: '', minPrice: '', maxPrice: '' }); setPriceInput({ min: '', max: '' }); }} className="text-blue-600 hover:underline">
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Phân trang (Pagination) */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 border-t pt-8">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0}
                                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {/* Render các nút số trang */}
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i)}
                                    className={`w-10 h-10 rounded-lg font-bold transition-all ${page === i
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages - 1}
                                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}