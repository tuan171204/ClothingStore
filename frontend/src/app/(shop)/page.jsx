'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { getProductsWithFilter } from '@/services/productService';
import { getCategoriesGrouped, getParentCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import {
    Filter, ChevronLeft, ChevronRight, Search, ArrowDown,
    Zap, X, SlidersHorizontal, ArrowRight, Star, TrendingUp,
    ShieldCheck, Truck, RefreshCw, HeartHandshake, Smile, Rocket, Shirt,
    SmileIcon,
    User
} from 'lucide-react';
import axios from '@/lib/axios';
import CountdownTimer from '@/components/shop/CountdownTimer';
import FlashSaleProgressBar from '@/components/shop/FlashSaleProgressBar';
import Link from 'next/link';

// ── Helpers ─────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

// ────────────────────────────────────────────────────────────
// SECTION: Trust badges
// ────────────────────────────────────────────────────────────
function TrustBadges() {
    const items = [
        { icon: Truck, label: 'Miễn phí vận chuyển', sub: 'Đơn hàng từ 500K' },
        { icon: RefreshCw, label: 'Đổi trả dễ dàng', sub: 'Trong vòng 30 ngày' },
        { icon: ShieldCheck, label: 'Hàng chính hãng 100%', sub: 'Cam kết chất lượng' },
        { icon: HeartHandshake, label: 'Hỗ trợ 24/7', sub: 'Luôn sẵn sàng giúp bạn' },
    ];
    return (
        <div className="w-full bg-gray-900 text-white py-10">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {items.map(({ icon: Icon, label, sub }) => (
                        <div key={label} className="flex items-center gap-4 group">
                            <div className="p-3 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors shrink-0">
                                <Icon size={22} className="text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-md">{label}</p>
                                <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Category showcase
// FIX: Chỉ hiển thị danh mục GỐC (parentCategories), link vào đó sẽ lọc được cả con
// ────────────────────────────────────────────────────────────
const CATEGORY_COVERS = [
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
    'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80',
];

function CategoryShowcase({ parentCategories }) {
    const display = parentCategories.slice(0, 6);
    return (
        <section className="w-full py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Khám phá</p>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Danh mục nổi bật</h2>
                    </div>
                    <Link href="/products" className="hidden sm:flex items-center gap-1.5 text-md font-bold text-gray-600
                        hover:text-gray-900 transition-colors group">
                        Xem tất cả <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {display.map((cat, i) => (
                        <Link key={cat.id} href={`/products?categoryId=${cat.id}`}
                            className="group relative aspect-[3/4] overflow-hidden rounded-2xl cursor-pointer">
                            <img src={CATEGORY_COVERS[i % CATEGORY_COVERS.length]} alt={cat.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white font-bold text-md text-center">{cat.name}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Brand strip
// ────────────────────────────────────────────────────────────
function BrandStrip({ brands }) {
    if (!brands?.length) return null;
    return (
        <section className="w-full py-12 bg-gray-50 border-y border-gray-100">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm font-bold tracking-widest text-gray-400 uppercase mb-8">
                    Thương hiệu đang kinh doanh
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
                    {brands.slice(0, 8).map((b) => (
                        <Link key={b.id} href={`/products?brandId=${b.id}`}
                            className="group flex items-center gap-2.5 px-5 py-3 bg-white rounded-2xl border border-gray-100
                                shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                            {b.logo
                                ? <img src={b.logo} alt={b.name} className="h-6 object-contain max-w-[80px]" />
                                : <span className="text-md font-black text-gray-700 tracking-wide">{b.name}</span>
                            }
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: New arrivals
// ────────────────────────────────────────────────────────────
function NewArrivals() {
    const [products, setProducts] = useState([]);
    useEffect(() => {
        getProductsWithFilter({ page: 0, limit: 8 })
            .then(d => setProducts(d.products ?? []));
    }, []);
    if (!products.length) return null;
    return (
        <section className="w-full py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="text-sm font-bold tracking-widest text-amber-500 uppercase mb-2">Mới nhất</p>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Hàng về mới</h2>
                    </div>
                    <Link href="/products" className="hidden sm:flex items-center gap-1.5 text-md font-bold
                        text-gray-600 hover:text-gray-900 group">
                        Xem tất cả <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <div className="flex justify-center mt-8 sm:hidden">
                    <Link href="/products"
                        className="px-8 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-bold text-md hover:bg-gray-900 hover:text-white transition-all">
                        Xem tất cả
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Editorial banner
// ────────────────────────────────────────────────────────────
function EditorialBanner() {
    return (
        <section className="w-full py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative overflow-hidden rounded-3xl aspect-[4/3] group cursor-pointer">
                        <img
                            src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
                            alt="Summer"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-1">Bộ sưu tập</p>
                            <h3 className="text-white text-2xl md:text-3xl font-black mb-3">Hè 2026</h3>
                            <Link href="/products?keyword=hè"
                                className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2 rounded-full text-md font-bold hover:bg-gray-100 transition-colors">
                                Khám phá <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-5 h-full">
                        <div className="relative overflow-hidden rounded-3xl group cursor-pointer flex-1">
                            <img
                                src="https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=700&q=80"
                                alt="Streetwear"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                            <div className="absolute inset-0 flex items-center p-5">
                                <div>
                                    <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-0.5">Phong cách</p>
                                    <h3 className="text-white text-xl font-black">Streetwear</h3>
                                    <Link href="/products?keyword=street"
                                        className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold mt-1.5">
                                        Xem ngay <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-3xl group cursor-pointer bg-gray-900 flex-1">
                            <img
                                src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=700&q=80"
                                alt="Basics"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 flex items-center p-5">
                                <div>
                                    <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-0.5">Tối giản</p>
                                    <h3 className="text-white text-xl font-black">Essential Basics</h3>
                                    <Link href="/products?keyword=basic"
                                        className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold mt-1.5">
                                        Khám phá <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Trending
// FIX: Dùng parentCategories cho tab, để backend lấy đủ SP của cả con
// ────────────────────────────────────────────────────────────
function TrendingSection({ parentCategories }) {
    const [activeTab, setActiveTab] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const tabs = parentCategories.slice(0, 7);

    useEffect(() => {
        if (tabs.length) setActiveTab(tabs[0].id);
    }, [parentCategories]);

    useEffect(() => {
        if (!activeTab) return;
        setLoading(true);
        getProductsWithFilter({ categoryId: activeTab, page: 0, limit: 4 })
            .then(d => setProducts(d.products ?? []))
            .finally(() => setLoading(false));
    }, [activeTab]);

    if (!tabs.length) return null;

    return (
        <section className="w-full py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-10">
                    <div className="flex-1">
                        <p className="text-md font-bold tracking-widest text-blue-500 uppercase mb-2">Đang hot</p>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Trending ngay bây giờ</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(cat => (
                            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                                className={`px-4 py-2 rounded-full text-md font-bold transition-all border
                                    ${activeTab === cat.id
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                    }`}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 transition-opacity
                    ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <div className="flex justify-center mt-8">
                    <Link href={`/products?categoryId=${activeTab}`}
                        className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-full font-bold text-md hover:bg-black transition-all hover:scale-105">
                        Xem thêm danh mục này <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Stats
// ────────────────────────────────────────────────────────────
function StatsSection() {
    const stats = [
        { value: '50K+', label: 'Khách hàng hài lòng', Icon: User, color: 'text-green-400', fillColor: 'currentColor' },
        { value: '1,200+', label: 'Sản phẩm đa dạng', Icon: Shirt, color: 'text-red-500', fillColor: 'currentColor' },
        { value: '4.9★', label: 'Đánh giá trung bình', Icon: Star, color: 'text-yellow-400', fillColor: 'currentColor' },
        { value: '99%', label: 'Giao hàng đúng hẹn', Icon: Rocket, color: 'text-blue-400', fillColor: 'currentColor' },
    ];
    return (
        <section className="w-full py-16 bg-gray-900 text-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map(({ value, label, Icon, color, fillColor }) => (
                        <div key={label} className="text-center group">
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">
                                <Icon size={40} fill={fillColor} className={`${color} transition-colors`} />
                            </div>
                            <p className="text-3xl md:text-4xl font-black mb-1 bg-gradient-to-r
                                from-white to-gray-300 bg-clip-text text-transparent">
                                {value}
                            </p>
                            <p className="text-gray-400 text-md font-medium">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Testimonials
// ────────────────────────────────────────────────────────────
const REVIEWS = [
    { name: 'Nguyễn Minh Anh', rating: 5, text: 'Chất vải cực kỳ tốt, đường may chắc chắn. Mặc vào rất thoải mái, sẽ quay lại mua tiếp!', avatar: 'M' },
    { name: 'Trần Thu Hà', rating: 5, text: 'Shop giao hàng nhanh, đóng gói cẩn thận. Sản phẩm y như hình, rất hài lòng!', avatar: 'H' },
    { name: 'Lê Văn Bình', rating: 5, text: 'Giá hợp lý, chất lượng vượt kỳ vọng. Flash sale rất hấp dẫn, mua được deal ngon.', avatar: 'B' },
];

function Testimonials() {
    return (
        <section className="w-full py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <p className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Phản hồi</p>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                        Khách hàng nói gì về chúng tôi?
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {REVIEWS.map(r => (
                        <div key={r.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100
                            hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-1 mb-4">
                                {Array(r.rating).fill(0).map((_, i) => (
                                    <Star key={i} size={14} fill="#f59e0b" stroke="none" />
                                ))}
                            </div>
                            <p className="text-gray-600 text-md leading-relaxed mb-5">"{r.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500
                                    flex items-center justify-center text-white font-bold text-md">
                                    {r.avatar}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-md">{r.name}</p>
                                    <p className="text-sm text-gray-400">Khách hàng xác thực</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Newsletter
// ────────────────────────────────────────────────────────────
function NewsletterCTA() {
    const [email, setEmail] = useState('');
    return (
        <section className="w-full py-20 bg-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 50%)',
                }} />
            <div className="container mx-auto px-4 relative z-10 text-center">
                <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-3">Không bỏ lỡ</p>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    Nhận ưu đãi độc quyền
                </h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto text-md md:text-base">
                    Đăng ký nhận bản tin để nhận thông báo Flash Sale sớm nhất và mã giảm giá đặc biệt.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                        value={email} onChange={e => setEmail(e.target.value)}
                        type="email" placeholder="email@clothstore.vn"
                        className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-400
                            px-5 py-3.5 rounded-full text-md outline-none focus:border-blue-400 transition-colors"
                    />
                    <button className="bg-white text-gray-900 px-7 py-3.5 rounded-full font-bold text-md
                        hover:bg-gray-100 transition-colors whitespace-nowrap">
                        Đăng ký ngay
                    </button>
                </div>
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────
// SECTION: Filter Sidebar (homepage product section)
// FIX: Dùng grouped categories thay vì flat list
// ────────────────────────────────────────────────────────────
function FilterSidebar({ grouped, orphans, allCategories, brands, filters, setFilters,
    searchInput, setSearchInput, priceInput, setPriceInput, page, setPage, setIsMobileFilterOpen }) {

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const applyPriceFilter = () => {
        setFilters(prev => ({ ...prev, minPrice: priceInput.min, maxPrice: priceInput.max }));
        setPage(0);
        setIsMobileFilterOpen?.(false);
    };

    const hasFilters = filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.keyword;

    return (
        <div className="space-y-8">
            {/* Search */}
            <div>
                <h4 className="text-md font-bold tracking-wide uppercase text-gray-500 mb-3">Tìm kiếm</h4>
                <div className="flex items-center gap-2 relative">
                    <input type="text" placeholder="Tên sản phẩm..."
                        className="w-full bg-gray-50 border border-gray-200 py-3 pl-4 pr-10 rounded-xl text-md focus:ring-2 focus:ring-gray-900 outline-none"
                        value={searchInput} onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                setFilters(p => ({ ...p, keyword: searchInput }));
                                setPage(0);
                            }
                        }}
                    />
                    <button onClick={() => { setFilters(p => ({ ...p, keyword: searchInput })); setPage(0); }}
                        className="absolute right-2 text-gray-400 hover:text-gray-900 transition-colors p-1">
                        <Search size={18} />
                    </button>
                </div>
            </div>

            {/* Categories — phân cấp cha → con */}
            <div>
                <h4 className="text-xs font-black tracking-widest uppercase text-gray-400 mb-3">Danh mục</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    <button onClick={() => handleFilterChange('categoryId', '')}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all
                            ${filters.categoryId === '' ? 'bg-gray-900 text-white font-bold shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                        Tất cả danh mục
                    </button>

                    {grouped.map(parent => {
                        const isParentActive = filters.categoryId === String(parent.id);
                        return (
                            <div key={parent.id} className="flex flex-col gap-1">
                                <button onClick={() => handleFilterChange('categoryId', String(parent.id))}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all
                                        ${isParentActive ? 'bg-gray-900 text-white font-bold shadow-md' : 'bg-gray-50 text-gray-700 font-semibold hover:bg-gray-100'}`}>
                                    {parent.name}
                                </button>

                                {parent.children.length > 0 && (
                                    <div className="pl-4 ml-4 border-l-2 border-gray-100 space-y-1 py-1">
                                        {parent.children.map(child => {
                                            const isChildActive = filters.categoryId === String(child.id);
                                            return (
                                                <button key={child.id} onClick={() => handleFilterChange('categoryId', String(child.id))}
                                                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all
                                                        ${isChildActive ? 'bg-gray-800 text-white font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                                                    {child.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {orphans.map(cat => (
                        <button key={cat.id} onClick={() => handleFilterChange('categoryId', String(cat.id))}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all
                                ${filters.categoryId === String(cat.id) ? 'bg-gray-900 text-white font-bold shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Brands - Chuyển thành Button */}
            <div>
                <h4 className="text-xs font-black tracking-widest uppercase text-gray-400 mb-3">Thương hiệu</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    <button onClick={() => handleFilterChange('brandId', '')}
                        className={`w-full flex items-center px-4 py-2.5 rounded-xl text-sm transition-all
                            ${filters.brandId === '' ? 'bg-gray-900 text-white font-bold shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                        Tất cả thương hiệu
                    </button>
                    {brands.map(b => {
                        const isActive = filters.brandId === String(b.id);
                        return (
                            <button key={b.id} onClick={() => handleFilterChange('brandId', String(b.id))}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all
                                    ${isActive ? 'bg-gray-900 text-white font-bold shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                {b.logo && <img src={b.logo} alt={b.name} className="w-5 h-5 object-contain rounded" />}
                                {b.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Price */}
            <div>
                <h4 className="text-md font-bold tracking-wide uppercase text-gray-500 mb-3">Mức giá (VND)</h4>
                <div className="flex items-center gap-2 mb-4">
                    <input type="number" placeholder="TỪ" min="0"
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-md focus:ring-2 focus:ring-gray-900 outline-none text-center"
                        value={priceInput.min} onChange={e => setPriceInput({ ...priceInput, min: e.target.value })} />
                    <span className="text-gray-400">-</span>
                    <input type="number" placeholder="ĐẾN" min="0"
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-md focus:ring-2 focus:ring-gray-900 outline-none text-center"
                        value={priceInput.max} onChange={e => setPriceInput({ ...priceInput, max: e.target.value })} />
                </div>
                <button onClick={applyPriceFilter}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl text-md font-bold hover:bg-black transition-all shadow-md active:scale-95">
                    ÁP DỤNG
                </button>
            </div>

            {hasFilters && (
                <button onClick={() => {
                    setFilters({ categoryId: '', brandId: '', minPrice: '', maxPrice: '', keyword: '' });
                    setSearchInput('');
                    setPriceInput({ min: '', max: '' });
                    setPage(0);
                    setIsMobileFilterOpen?.(false);
                }}
                    className="w-full py-3 border border-red-300 text-red-600 rounded-xl text-md font-bold hover:bg-red-50">
                    Xóa tất cả bộ lọc
                </button>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────
const HERO_VIDEOS = [
    'https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/Campaign/Jeans/Jeans_street_m_pc_2-1-movie.mp4',
    'https://image.uniqlo.com/UQ/CMS/video/jp/2026/HOME/GL_Aseets/LWm/26SSLWm_TOP2_w_pc_HPGL_2-1-movie_1.mp4',
];

export default function HomePage() {
    const [products, setProducts] = useState([]);
    // FIX: tách riêng parentCategories (cho showcase/trending) và grouped (cho filter sidebar)
    const [parentCategories, setParentCategories] = useState([]);
    const [grouped, setGrouped] = useState([]);
    const [orphans, setOrphans] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [flashSale, setFlashSale] = useState(null);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ keyword: '', categoryId: '', brandId: '', minPrice: '', maxPrice: '' });
    const [searchInput, setSearchInput] = useState('');
    const [priceInput, setPriceInput] = useState({ min: '', max: '' });
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        Promise.all([
            getCategoriesGrouped(),
            getBrands(),
        ]).then(([catData, brs]) => {
            setGrouped(catData.grouped || []);
            setOrphans(catData.orphans || []);
            setAllCategories(catData.all || []);
            // Danh mục cha cho showcase & trending
            setParentCategories(catData.grouped?.map(g => ({ id: g.id, name: g.name })) || []);
            setBrands(brs);
        });

        axios.get('/flash-sales/current-active').then(res => {
            if (res.status === 200 && res.data) setFlashSale(res.data);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        const params = { page, limit: 6 };
        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.brandId) params.brandId = filters.brandId;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        getProductsWithFilter(params).then(d => {
            setProducts(d.products || []);
            setTotalPages(d.totalPages || 0);
            setTotalElements(d.totalElements || 0);
        });
    }, [filters, page]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => { });
        }
    }, [currentVideoIndex]);

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
            document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const filterProps = {
        grouped, orphans, allCategories, brands,
        filters, setFilters,
        searchInput, setSearchInput,
        priceInput, setPriceInput,
        page, setPage,
    };

    return (
        <div className="w-full flex flex-col">

            {/* HERO */}
            <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
                <video ref={videoRef} autoPlay muted playsInline
                    onEnded={() => setCurrentVideoIndex(p => (p + 1) % HERO_VIDEOS.length)}
                    className="absolute inset-0 w-full h-full object-cover scale-105">
                    <source src={HERO_VIDEOS[currentVideoIndex]} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/70" />
                <div className="relative z-10 text-center px-4 flex flex-col items-center">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-xl">
                        ClothStore
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-200 font-medium mb-8 sm:mb-10 max-w-2xl drop-shadow-md px-2">
                        Định hình phong cách, khẳng định chất riêng của bạn với bộ sưu tập mới nhất 2026.
                    </p>
                    <button onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group flex items-center gap-2 bg-white text-gray-900 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-md tracking-widest uppercase hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] cursor-pointer">
                        Khám phá ngay
                        <ArrowDown size={20} className="-translate-y-0.5 group-hover:translate-y-1 transition-transform" />
                    </button>
                </div>
            </section>

            <TrustBadges />

            {/* FIX: truyền parentCategories (chỉ danh mục gốc) */}
            {parentCategories.length > 0 && <CategoryShowcase parentCategories={parentCategories} />}

            {/* FLASH SALE */}
            {flashSale && (
                <div className="w-full bg-linear-to-r from-red-50 to-orange-50 py-10 sm:py-12 border-y border-red-100 overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="text-red-600 animate-pulse" fill="currentColor" size={28} />
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 tracking-tight uppercase italic drop-shadow-sm">
                                        {flashSale.name}
                                    </h2>
                                </div>
                                <p className="text-red-800/80 font-semibold text-md sm:text-lg ml-1">Nhanh tay chốt đơn, số lượng có hạn!</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl shadow-sm border border-red-200 flex items-center gap-3 sm:gap-4 shrink-0 self-start sm:self-auto">
                                <span className="font-bold text-gray-800 uppercase text-md tracking-wider">Kết thúc trong</span>
                                <CountdownTimer endTime={flashSale.endTime} onExpire={() => setFlashSale(null)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                            {flashSale.items.map(item => {
                                const discountPct = Math.round(((item.originalPrice - item.promotionalPrice) / item.originalPrice) * 100);
                                return (
                                    <Link href={`/products/${item.productId}`} key={item.id}
                                        className="group bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-red-100 flex flex-col relative cursor-pointer">
                                        <div className="absolute top-2 right-2 bg-red-600 text-white text-sm font-black px-1.5 py-0.5 rounded-lg z-10">
                                            -{discountPct}%
                                        </div>
                                        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 sm:mb-3 relative">
                                            <img src={item.thumbnailUrl || 'https://placehold.co/400?text=No+Image'}
                                                alt={item.productName}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            {item.remainingQuantity === 0 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                                    <span className="bg-white text-black px-2 py-0.5 rounded-full font-bold text-sm uppercase tracking-widest">Hết hàng</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <h3 className="font-bold text-gray-900 text-sm sm:text-lg line-clamp-1 sm:line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                                                {item.productName}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-0.5 truncate hidden sm:block">{item.variantName}</p>
                                            <div className="mt-auto pt-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5">
                                                    <span className="font-black text-red-600 text-md sm:text-lg">
                                                        {fmt(item.promotionalPrice)}
                                                    </span>
                                                    <span className="text-sm text-gray-400 line-through font-medium">
                                                        {fmt(item.originalPrice)}
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

            <NewArrivals />
            <EditorialBanner />
            {brands.length > 0 && <BrandStrip brands={brands} />}

            {/* FIX: truyền parentCategories cho tab switching */}
            {parentCategories.length > 0 && <TrendingSection parentCategories={parentCategories} />}

            <StatsSection />

            {/* PRODUCTS SECTION */}
            <div id="products-section" className="w-full bg-slate-50">
                <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24">
                    {/* Mobile filter toggle */}
                    <div className="flex items-center justify-between mb-6 md:hidden">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tất cả sản phẩm</h2>
                            <p className="text-md text-gray-500 mt-0.5">Tìm thấy <strong>{totalElements}</strong> kết quả</p>
                        </div>
                        <button onClick={() => setIsMobileFilterOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-md font-bold text-gray-700 hover:border-gray-900 transition-colors shadow-sm">
                            <SlidersHorizontal size={16} />
                            Bộ lọc
                            {(filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.keyword) && (
                                <span className="w-2 h-2 bg-gray-900 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Mobile filter drawer */}
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
                                    <FilterSidebar {...filterProps} setIsMobileFilterOpen={setIsMobileFilterOpen} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-10">
                        {/* Desktop sidebar */}
                        <div className="hidden md:block w-full md:w-1/4 space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-900 border-b pb-4">
                                    <Filter size={20} /> Bộ lọc
                                </h3>
                                <FilterSidebar {...filterProps} />
                            </div>
                        </div>

                        {/* Products grid */}
                        <div className="w-full md:w-3/4">
                            <div className="hidden md:flex mb-8 flex-col sm:flex-row sm:justify-between sm:items-end border-b border-gray-200 pb-4 gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tất cả sản phẩm</h2>
                                    <p className="text-gray-500 mt-1">Cập nhật những xu hướng mới nhất</p>
                                </div>
                                <div className="text-md text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-full font-medium shadow-sm">
                                    Tìm thấy <strong className="text-gray-900">{totalElements}</strong> kết quả
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 sm:gap-6 mb-12">
                                {products.length > 0 ? products.map(p => (
                                    <ProductCard key={p.id} product={p} />
                                )) : (
                                    <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500 mb-4 font-medium text-md sm:text-base">Không tìm thấy sản phẩm nào phù hợp.</p>
                                        <button onClick={() => { setFilters({ categoryId: '', brandId: '', minPrice: '', maxPrice: '', keyword: '' }); setPriceInput({ min: '', max: '' }); }}
                                            className="px-6 py-2 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-colors font-bold text-md">
                                            XÓA BỘ LỌC
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-1.5 sm:gap-2 pt-4 flex-wrap">
                                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 0}
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
                                        <ChevronLeft size={20} />
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button key={i} onClick={() => handlePageChange(i)}
                                            className={`min-w-[44px] min-h-[44px] rounded-xl font-bold transition-all text-md ${page === i ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`}>
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1}
                                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Testimonials />
            <NewsletterCTA />
        </div>
    );
}