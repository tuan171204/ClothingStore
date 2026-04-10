'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { getProductsWithFilter } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import { Filter, ChevronLeft, ChevronRight, Search, ArrowDown, Zap, X, SlidersHorizontal } from 'lucide-react';
import axios from '@/lib/axios';
import CountdownTimer from '@/components/shop/CountdownTimer';
import FlashSaleProgressBar from '@/components/shop/FlashSaleProgressBar';
import Link from 'next/link';

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);

    const [flashSale, setFlashSale] = useState(null);

    // ADDED: mobile filter drawer state
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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
            const params = { page, limit: 6 };
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

    useEffect(() => {
        const fetchFlashSale = async () => {
            try {
                const res = await axios.get('/flash-sales/current-active');
                if (res.status === 200 && res.data) {
                    setFlashSale(res.data);
                } else {
                    setFlashSale(null);
                }
            } catch (error) {
                console.error("No active flash sale or error", error);
            }
        };
        fetchFlashSale();
    }, []);

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
        // ADDED: close mobile filter after apply
        setIsMobileFilterOpen(false);
    };

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, keyword: searchInput }));
        setPage(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
            document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scrollToProducts = () => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleVideoEnd = () => {
        setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % HERO_VIDEOS.length);
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay was prevented:", error);
                });
            }
        }
    }, [currentVideoIndex]);

    // ADDED: filter sidebar content extracted as reusable JSX
    const FilterSidebar = () => (
        <div className="space-y-8">
            {/* Từ khóa */}
            <div>
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
            <div>
                <h4 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-3">Danh mục</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
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
            <div>
                <h4 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-3">Thương hiệu</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
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

            {/* ADDED: clear all filters button in mobile drawer */}
            {(filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.keyword) && (
                <button
                    onClick={() => {
                        setFilters({ categoryId: '', brandId: '', minPrice: '', maxPrice: '', keyword: '' });
                        setSearchInput('');
                        setPriceInput({ min: '', max: '' });
                        setPage(0);
                        setIsMobileFilterOpen(false);
                    }}
                    className="w-full py-3 border border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
                >
                    Xóa tất cả bộ lọc
                </button>
            )}
        </div>
    );

    return (
        <div className="w-full flex flex-col font-sans">
            {/* HERO — unchanged desktop, ADDED: reduced text on mobile */}
            <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnd}
                    className="absolute inset-0 w-full h-full object-cover scale-105"
                >
                    <source src={HERO_VIDEOS[currentVideoIndex]} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/70"></div>
                <div className="relative z-10 text-center px-4 flex flex-col items-center">
                    {/* ADDED: responsive text size */}
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-xl">
                        ClothStore
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-200 font-medium mb-8 sm:mb-10 max-w-2xl drop-shadow-md px-2">
                        Định hình phong cách, khẳng định chất riêng của bạn với bộ sưu tập mới nhất 2026.
                    </p>
                    <button
                        onClick={scrollToProducts}
                        className="group flex items-center gap-2 bg-white text-gray-900 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] cursor-pointer"
                    >
                        Khám phá ngay
                        <ArrowDown size={20} className="-translate-y-0.5 group-hover:translate-y-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* FLASH SALE — ADDED: responsive grid cols */}
            {flashSale && (
                <div className="w-full bg-linear-to-r from-red-50 to-orange-50 py-10 sm:py-12 border-y border-red-100 overflow-hidden">
                    <div className="container mx-auto px-4">
                        {/* ADDED: flex-col on mobile, row on md+ */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="text-red-600 animate-pulse" fill="currentColor" size={28} />
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 tracking-tight uppercase italic drop-shadow-sm">
                                        {flashSale.name}
                                    </h2>
                                </div>
                                <p className="text-red-800/80 font-semibold text-sm sm:text-md ml-1">Nhanh tay chốt đơn, số lượng có hạn!</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl shadow-sm border border-red-200 flex items-center gap-3 sm:gap-4 shrink-0 self-start sm:self-auto">
                                <span className="font-bold text-gray-800 uppercase text-sm tracking-wider">Kết thúc trong</span>
                                <CountdownTimer
                                    endTime={flashSale.endTime}
                                    onExpire={() => setFlashSale(null)}
                                />
                            </div>
                        </div>

                        {/* ADDED: 2 cols on mobile, 4 on md, 5 on lg */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                            {flashSale.items.map(item => {
                                const discountPct = Math.round(((item.originalPrice - item.promotionalPrice) / item.originalPrice) * 100);
                                return (
                                    <Link href={`/products/${item.productId}`} key={item.id} className="group bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-red-100 flex flex-col relative cursor-pointer">
                                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-black px-1.5 py-0.5 rounded-lg z-10">
                                            -{discountPct}%
                                        </div>
                                        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 sm:mb-3 relative">
                                            <img
                                                src={item.thumbnailUrl || 'https://placehold.co/400?text=No+Image'}
                                                alt={item.productName}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            {item.remainingQuantity === 0 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                                    <span className="bg-white text-black px-2 py-0.5 rounded-full font-bold text-xs uppercase tracking-widest">Hết hàng</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            {/* ADDED: line-clamp-1 on mobile for tighter cards */}
                                            <h3 className="font-bold text-gray-900 text-xs sm:text-md line-clamp-1 sm:line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                                                {item.productName}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate hidden sm:block">{item.variantName}</p>
                                            <div className="mt-auto pt-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5">
                                                    <span className="font-black text-red-600 text-sm sm:text-lg">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.promotionalPrice)}
                                                    </span>
                                                    <span className="text-xs text-gray-400 line-through font-medium">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.originalPrice)}
                                                    </span>
                                                </div>
                                                <FlashSaleProgressBar total={item.totalQuantity} sold={item.soldQuantity} />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCTS SECTION */}
            <div id="products-section" className="w-full bg-slate-50">
                <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24">

                    {/* ADDED: mobile filter toggle bar */}
                    <div className="flex items-center justify-between mb-6 md:hidden">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sản phẩm</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Tìm thấy <strong>{totalElements}</strong> kết quả</p>
                        </div>
                        <button
                            onClick={() => setIsMobileFilterOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-900 transition-colors shadow-sm"
                        >
                            <SlidersHorizontal size={16} />
                            Bộ lọc
                            {(filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.keyword) && (
                                <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
                            )}
                        </button>
                    </div>

                    {/* ADDED: mobile filter drawer overlay */}
                    {isMobileFilterOpen && (
                        <div className="fixed inset-0 z-50 md:hidden">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileFilterOpen(false)} />
                            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-2xl flex flex-col">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Filter size={18} /> Bộ lọc
                                    </h3>
                                    <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5">
                                    <FilterSidebar />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADDED: flex-col on mobile, row on md+ */}
                    <div className="flex flex-col md:flex-row gap-10">
                        {/* SIDEBAR — hidden on mobile (shown as drawer), sticky on desktop */}
                        <div className="hidden md:block w-full md:w-1/4 space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-900 border-b pb-4">
                                    <Filter size={20} /> Bộ lọc
                                </h3>
                                <FilterSidebar />
                            </div>
                        </div>

                        {/* MAIN CONTENT */}
                        <div className="w-full md:w-3/4">
                            {/* Header — hidden on mobile (already shown above) */}
                            <div className="hidden md:flex mb-8 flex-col sm:flex-row sm:justify-between sm:items-end border-b border-gray-200 pb-4 gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sản phẩm</h2>
                                    <p className="text-gray-500 mt-1">Cập nhật những xu hướng mới nhất</p>
                                </div>
                                <div className="text-sm text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-full font-medium shadow-sm">
                                    Tìm thấy <strong className="text-gray-900">{totalElements}</strong> kết quả
                                </div>
                            </div>

                            {/* ADDED: 2 cols on mobile xs, 2 on sm, 3 on lg */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 sm:gap-6 mb-12">
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))
                                ) : (
                                    <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 mb-4 font-medium text-sm sm:text-base">Không tìm thấy sản phẩm nào phù hợp.</p>
                                        <button
                                            onClick={() => { setFilters({ categoryId: '', brandId: '', minPrice: '', maxPrice: '', keyword: '' }); setPriceInput({ min: '', max: '' }); }}
                                            className="px-6 py-2 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-colors font-bold text-sm"
                                        >
                                            XÓA BỘ LỌC
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* PAGINATION — ADDED: touch-friendly larger buttons on mobile */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-1.5 sm:gap-2 pt-4 flex-wrap">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 0}
                                        className="p-2.5 sm:p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 disabled:hover:border-gray-200 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i)}
                                            className={`min-w-[44px] min-h-[44px] rounded-xl font-bold transition-all text-sm sm:text-base ${page === i
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
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 disabled:hover:border-gray-200 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
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