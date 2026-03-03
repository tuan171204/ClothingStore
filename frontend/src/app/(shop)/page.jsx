'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { getProductsWithFilter } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { Filter, ChevronLeft, ChevronRight, Search, ArrowDown } from 'lucide-react';

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);

    const [filters, setFilters] = useState({
        keyword: '',
        categoryId: '',
        brandId: '',
        minPrice: '',
        maxPrice: ''
    });

    const [searchInput, setSearchInput] = useState('');
    const [priceInput, setPriceInput] = useState({ min: '', max: '' });

    const HERO_VIDEOS = [
        "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/Campaign/Jeans/Jeans_street_m_pc_2-1-movie.mp4",
        "https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/LWm/26SSLWm_TOP2_w_pc_HPGL_2-1-movie_1.mp4"
    ];

    // STATE VÀ REF CHO VIDEO LOOP HERI SECTION
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const videoRef = useRef(null);

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

    useEffect(() => {
        const fetchProducts = async () => {
            const params = { page, limit: 6 }; // Tăng limit lên 6 hoặc 9 cho đẹp lưới
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.categoryId) params.categoryId = filters.categoryId;
            if (filters.brandId) params.brandId = filters.brandId;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const data = await getProductsWithFilter(params);
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        };

        fetchProducts();
    }, [filters, page]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const applyPriceFilter = () => {
        setFilters(prev => ({
            ...prev,
            minPrice: priceInput.min,
            maxPrice: priceInput.max
        }));
        setPage(0);
    };

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, keyword: searchInput }));
        setPage(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
            // Cuộn lên đầu phần sản phẩm thay vì cuộn lên tít trên cùng video
            document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Hàm cuộn mượt xuống phần sản phẩm khi bấm nút ở Hero
    const scrollToProducts = () => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    };


    // HÀM XỬ LÝ KHI VIDEO KẾT THÚC
    const handleVideoEnd = () => {
        // Chuyển sang video tiếp theo, nếu đang ở cuối thì quay lại 0
        setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % HERO_VIDEOS.length);
    };

    // Tự động load lại video khi index thay đổi
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            // Optional: Thêm đoạn catch lỗi nếu browser block autoplay
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay was prevented:", error);
                });
            }
        }
    }, [currentVideoIndex]);

    return (
        <div className="w-full flex flex-col font-sans">
            {/* ================= HERO SECTION (FULL MÀN HÌNH) ================= */}
            <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
                {/* Background Video */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnd} // Lắng nghe sự kiện kết thúc
                    className="absolute inset-0 w-full h-full object-cover scale-105"
                >
                    {/* Source lấy từ mảng */}
                    <source src={HERO_VIDEOS[currentVideoIndex]} type="video/mp4" />
                </video>

                {/* Lớp phủ Gradient Tối giúp chữ nổi bật và Header hòa vào nền */}
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/70"></div>

                {/* Nội dung Hero */}
                <div className="relative z-10 text-center px-4 flex flex-col items-center">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-xl">
                        ClothStore
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 font-medium mb-10 max-w-2xl drop-shadow-md">
                        Định hình phong cách, khẳng định chất riêng của bạn với bộ sưu tập mới nhất 2026.
                    </p>
                    <button
                        onClick={scrollToProducts}
                        className="group flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] cursor-pointer"
                    >
                        Khám phá ngay
                        <ArrowDown size={22} className="-translate-y-0.5 group-hover:translate-y-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* ================= KHU VỰC SẢN PHẨM ================= */}
            {/* Đặt ID ở đây để scroll từ Header hoặc Hero button */}
            <div id="products-section" className="w-full bg-slate-50">
                <div className="container mx-auto px-4 py-16 md:py-24">

                    <div className="flex flex-col md:flex-row gap-10">
                        {/* SIDEBAR BỘ LỌC */}
                        <div className="w-full md:w-1/4 space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-900 border-b pb-4">
                                    <Filter size={20} /> Bộ lọc
                                </h3>

                                {/* Từ khóa */}
                                <div className="mb-8">
                                    <h4 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-3">Tìm kiếm</h4>
                                    <div className="flex items-center gap-2 relative">
                                        <input
                                            type="text"
                                            placeholder="Tên sản phẩm..."
                                            className="w-full bg-gray-50 border border-gray-200 py-3 pl-4 pr-10 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                                            value={searchInput}
                                            onChange={e => setSearchInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="absolute right-2 text-gray-400 hover:text-gray-900 transition-colors p-1"
                                        >
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Danh mục */}
                                <div className="mb-8">
                                    <h4 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-3">Danh mục</h4>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="radio" name="category" checked={filters.categoryId === ''} onChange={() => handleFilterChange('categoryId', '')} className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" />
                                            <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Tất cả danh mục</span>
                                        </label>
                                        {categories.map(c => (
                                            <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="radio" name="category" checked={filters.categoryId === String(c.id)} onChange={() => handleFilterChange('categoryId', String(c.id))} className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" />
                                                <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{c.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Thương hiệu */}
                                <div className="mb-8">
                                    <h4 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-3">Thương hiệu</h4>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="radio" name="brand" checked={filters.brandId === ''} onChange={() => handleFilterChange('brandId', '')} className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" />
                                            <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Tất cả thương hiệu</span>
                                        </label>
                                        {brands.map(b => (
                                            <label key={b.id} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="radio" name="brand" checked={filters.brandId === String(b.id)} onChange={() => handleFilterChange('brandId', String(b.id))} className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" />
                                                <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{b.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Khoảng giá */}
                                <div>
                                    <h4 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-3">Mức giá (VND)</h4>
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="number" placeholder="TỪ" min="0"
                                            className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none text-center"
                                            value={priceInput.min} onChange={e => setPriceInput({ ...priceInput, min: e.target.value })}
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="number" placeholder="ĐẾN" min="0"
                                            className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none text-center"
                                            value={priceInput.max} onChange={e => setPriceInput({ ...priceInput, max: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={applyPriceFilter}
                                        className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95"
                                    >
                                        ÁP DỤNG
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MAIN CONTENT - GRID SẢN PHẨM */}
                        <div className="w-full md:w-3/4">
                            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-gray-200 pb-4 gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sản phẩm</h2>
                                    <p className="text-gray-500 mt-1">Cập nhật những xu hướng mới nhất</p>
                                </div>
                                <div className="text-sm text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-full font-medium shadow-sm">
                                    Tìm thấy <strong className="text-gray-900">{totalElements}</strong> kết quả
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))
                                ) : (
                                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 mb-4 font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
                                        <button
                                            onClick={() => { setFilters({ categoryId: '', brandId: '', minPrice: '', maxPrice: '' }); setPriceInput({ min: '', max: '' }); }}
                                            className="px-6 py-2 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-colors font-bold text-sm"
                                        >
                                            XÓA BỘ LỌC
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Phân trang */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 pt-4">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 0}
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 disabled:hover:border-gray-200 transition-all"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i)}
                                            className={`w-11 h-11 rounded-xl font-bold transition-all ${page === i
                                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages - 1}
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 disabled:hover:border-gray-200 transition-all"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}