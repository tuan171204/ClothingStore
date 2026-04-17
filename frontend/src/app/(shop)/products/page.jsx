'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/shop/ProductCard';
import { getProductsWithFilter } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getBrands } from '@/services/brandService';
import {
    Filter, ChevronLeft, ChevronRight, Search, X,
    SlidersHorizontal, Home, ChevronRight as Chevron,
    LayoutGrid, List, ArrowUpDown, Tag, RefreshCw,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: '', label: 'Mặc định' },
    { value: 'price_asc', label: 'Giá: Thấp → Cao' },
    { value: 'price_desc', label: 'Giá: Cao → Thấp' },
    { value: 'newest', label: 'Mới nhất' },
];

// ── Breadcrumb ───────────────────────────────────────────────
function Breadcrumb({ category, brand }) {
    return (
        <nav className="flex items-center gap-2 text-md text-gray-500 mb-6">
            <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
                <Home size={14} /> Trang chủ
            </Link>
            <Chevron size={13} className="text-gray-300" />
            <span className="text-gray-900 font-semibold">Sản phẩm</span>
            {category && (
                <>
                    <Chevron size={13} className="text-gray-300" />
                    <span className="text-gray-900 font-semibold">{category}</span>
                </>
            )}
            {brand && (
                <>
                    <Chevron size={13} className="text-gray-300" />
                    <span className="text-gray-900 font-semibold">{brand}</span>
                </>
            )}
        </nav>
    );
}

// ── Active filter chips ──────────────────────────────────────
function ActiveFilters({ filters, categories, brands, onRemove, onClearAll }) {
    const chips = [];

    if (filters.keyword) chips.push({
        key: 'keyword',
        label: `Tìm kiếm: "${filters.keyword}"`,
    });
    if (filters.categoryId) {
        const cat = categories.find(c => String(c.id) === String(filters.categoryId));
        if (cat) chips.push({ key: 'categoryId', label: `Danh mục: ${cat.name}` });
    }
    if (filters.brandId) {
        const br = brands.find(b => String(b.id) === String(filters.brandId));
        if (br) chips.push({ key: 'brandId', label: `Thương hiệu: ${br.name}` });
    }
    if (filters.minPrice || filters.maxPrice) chips.push({
        key: 'price',
        label: `Giá: ${filters.minPrice ? `${Number(filters.minPrice).toLocaleString('vi-VN')}đ` : '0'} – ${filters.maxPrice ? `${Number(filters.maxPrice).toLocaleString('vi-VN')}đ` : '∞'}`,
    });

    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Bộ lọc:</span>
            {chips.map(chip => (
                <span key={chip.key}
                    className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                    {chip.label}
                    <button onClick={() => onRemove(chip.key)}
                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                        <X size={11} />
                    </button>
                </span>
            ))}
            <button onClick={onClearAll}
                className="text-sm font-bold text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">
                Xóa tất cả
            </button>
        </div>
    );
}

// ── Sidebar filter panel ─────────────────────────────────────
function FilterPanel({ categories, brands, filters, onChange, priceInput, setPriceInput, onApplyPrice, onClose }) {
    const hasFilters = filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.keyword;

    return (
        <div className="space-y-7">
            {/* Search */}
            <div>
                <h4 className="text-sm font-black tracking-widest text-gray-400 uppercase mb-3">Từ khóa</h4>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tên sản phẩm..."
                        value={filters.keyword ?? ''}
                        onChange={e => onChange('keyword', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 py-2.5 pl-9 pr-4 rounded-xl text-md
                            focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                    />
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    {filters.keyword && (
                        <button onClick={() => onChange('keyword', '')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
                <div>
                    <h4 className="text-sm font-black tracking-widest text-gray-400 uppercase mb-3">Danh mục</h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                        <button
                            onClick={() => onChange('categoryId', '')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-md font-medium transition-all
                                ${!filters.categoryId ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                            Tất cả danh mục
                        </button>
                        {categories.map(c => (
                            <button key={c.id}
                                onClick={() => onChange('categoryId', String(c.id))}
                                className={`w-full text-left px-3 py-2 rounded-lg text-md font-medium transition-all
                                    ${String(filters.categoryId) === String(c.id)
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Brands */}
            {brands.length > 0 && (
                <div>
                    <h4 className="text-sm font-black tracking-widest text-gray-400 uppercase mb-3">Thương hiệu</h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        <button
                            onClick={() => onChange('brandId', '')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-md font-medium transition-all
                                ${!filters.brandId ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                            Tất cả thương hiệu
                        </button>
                        {brands.map(b => (
                            <button key={b.id}
                                onClick={() => onChange('brandId', String(b.id))}
                                className={`w-full text-left px-3 py-2 rounded-lg text-md font-medium transition-all flex items-center gap-2
                                    ${String(filters.brandId) === String(b.id)
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                {b.logo && (
                                    <img src={b.logo} alt={b.name}
                                        className="w-5 h-5 object-contain rounded" />
                                )}
                                {b.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Price range */}
            <div>
                <h4 className="text-sm font-black tracking-widest text-gray-400 uppercase mb-3">Khoảng giá</h4>
                <div className="flex items-center gap-2 mb-3">
                    <input
                        type="number" placeholder="Từ" min="0"
                        value={priceInput.min}
                        onChange={e => setPriceInput(p => ({ ...p, min: e.target.value }))}
                        className="w-full border border-gray-200 bg-gray-50 px-3 py-2 rounded-xl text-md text-center
                            focus:ring-2 focus:ring-gray-900 outline-none"
                    />
                    <span className="text-gray-300 font-bold">—</span>
                    <input
                        type="number" placeholder="Đến" min="0"
                        value={priceInput.max}
                        onChange={e => setPriceInput(p => ({ ...p, max: e.target.value }))}
                        className="w-full border border-gray-200 bg-gray-50 px-3 py-2 rounded-xl text-md text-center
                            focus:ring-2 focus:ring-gray-900 outline-none"
                    />
                </div>

                {/* Quick price buttons */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[
                        { label: '< 200K', min: '', max: '200000' },
                        { label: '200–500K', min: '200000', max: '500000' },
                        { label: '500K–1M', min: '500000', max: '1000000' },
                        { label: '> 1M', min: '1000000', max: '' },
                    ].map(r => (
                        <button key={r.label}
                            onClick={() => {
                                setPriceInput({ min: r.min, max: r.max });
                                onApplyPrice(r.min, r.max);
                                onClose?.();
                            }}
                            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold
                                text-gray-600 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-100 transition-all text-center">
                            {r.label}
                        </button>
                    ))}
                </div>

                <button onClick={() => { onApplyPrice(priceInput.min, priceInput.max); onClose?.(); }}
                    className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-md font-bold hover:bg-black transition-all active:scale-95">
                    Áp dụng
                </button>
            </div>

            {/* Clear all */}
            {hasFilters && (
                <button
                    onClick={() => {
                        onChange('_reset', '');
                        setPriceInput({ min: '', max: '' });
                        onClose?.();
                    }}
                    className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-md font-bold
                        hover:bg-red-50 hover:border-red-300 transition-all">
                    Xóa tất cả bộ lọc
                </button>
            )}
        </div>
    );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState({ onClear }) {
    return (
        <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center
            py-24 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Tag size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold text-base mb-1">Không tìm thấy sản phẩm nào</p>
            <p className="text-gray-400 text-md mb-5">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            <button onClick={onClear}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold text-md
                    hover:bg-black transition-all hover:scale-105">
                Xóa bộ lọc
            </button>
        </div>
    );
}

// ── Skeleton loader ──────────────────────────────────────────
function ProductSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="aspect-[3/4] bg-gray-100 rounded-sm mb-4" />
            <div className="h-3 bg-gray-100 rounded mb-2 w-1/2" />
            <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
        </div>
    );
}

// ── MAIN INNER (uses useSearchParams) ───────────────────────
function ProductsPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Read initial values from URL (supports links from homepage)
    const initCategory = searchParams.get('categoryId') ?? '';
    const initBrand = searchParams.get('brandId') ?? '';
    const initKeyword = searchParams.get('keyword') ?? '';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [sort, setSort] = useState('');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const [filters, setFilters] = useState({
        keyword: initKeyword,
        categoryId: initCategory,
        brandId: initBrand,
        minPrice: '',
        maxPrice: '',
    });
    const [priceInput, setPriceInput] = useState({ min: '', max: '' });

    const LIMIT = 12;

    // ── Load reference data ────────────────────────────────
    useEffect(() => {
        Promise.all([getCategories(), getBrands()]).then(([cats, brs]) => {
            setCategories(Array.isArray(cats) ? cats : []);
            setBrands(Array.isArray(brs) ? brs : []);
        });
    }, []);

    // ── Re-sync from URL when params change (e.g. browser back) ──
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            categoryId: searchParams.get('categoryId') ?? '',
            brandId: searchParams.get('brandId') ?? '',
            keyword: searchParams.get('keyword') ?? '',
        }));
        setPage(0);
    }, [searchParams.toString()]);

    // ── Fetch products ────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT };
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.categoryId) params.categoryId = filters.categoryId;
            if (filters.brandId) params.brandId = filters.brandId;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const data = await getProductsWithFilter(params);
            let prods = data.products ?? [];

            // Client-side sort (backend doesn't expose sort param)
            if (sort === 'price_asc') prods = [...prods].sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
            if (sort === 'price_desc') prods = [...prods].sort((a, b) => (b.basePrice ?? 0) - (a.basePrice ?? 0));
            if (sort === 'newest') prods = [...prods].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

            setProducts(prods);
            setTotalPages(data.totalPages ?? 0);
            setTotalElements(data.totalElements ?? 0);
        } catch (e) {
            console.error(e);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [filters, page, sort]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // ── Handlers ─────────────────────────────────────────
    const handleFilterChange = (key, value) => {
        if (key === '_reset') {
            setFilters({ keyword: '', categoryId: '', brandId: '', minPrice: '', maxPrice: '' });
            setPriceInput({ min: '', max: '' });
            setPage(0);
            return;
        }
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handleApplyPrice = (min, max) => {
        setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }));
        setPage(0);
    };

    const handleRemoveFilter = (key) => {
        if (key === 'price') {
            setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
            setPriceInput({ min: '', max: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: '' }));
        }
        setPage(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Derived display names for breadcrumb ─────────────
    const activeCategoryName = categories.find(c => String(c.id) === String(filters.categoryId))?.name;
    const activeBrandName = brands.find(b => String(b.id) === String(filters.brandId))?.name;

    const filterPanelProps = {
        categories, brands, filters,
        onChange: handleFilterChange,
        priceInput, setPriceInput,
        onApplyPrice: handleApplyPrice,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Page header bar ── */}
            <div className="bg-white border-b border-gray-100 mt-30">
                <div className="container mx-auto px-4 py-5">
                    <Breadcrumb category={activeCategoryName} brand={activeBrandName} />
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-0 sm:justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                {activeCategoryName ?? activeBrandName ?? 'Tất cả sản phẩm'}
                            </h1>
                            {!loading && (
                                <p className="text-md text-gray-500 mt-1">
                                    {totalElements > 0
                                        ? <><strong className="text-gray-900">{totalElements}</strong> sản phẩm được tìm thấy</>
                                        : 'Không tìm thấy sản phẩm nào'}
                                </p>
                            )}
                        </div>

                        {/* Toolbar: sort + view mode + mobile filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Sort */}
                            <div className="relative flex items-center">
                                <ArrowUpDown size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                                <select
                                    value={sort}
                                    onChange={e => { setSort(e.target.value); setPage(0); }}
                                    className="pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-md font-medium bg-white
                                        focus:ring-2 focus:ring-gray-900 outline-none appearance-none cursor-pointer">
                                    {SORT_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* View mode toggle (desktop) */}
                            <div className="hidden md:flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                <button onClick={() => setViewMode('grid')}
                                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    <LayoutGrid size={16} />
                                </button>
                                <button onClick={() => setViewMode('list')}
                                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    <List size={16} />
                                </button>
                            </div>

                            {/* Mobile filter button */}
                            <button
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="flex md:hidden items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-md font-bold">
                                <SlidersHorizontal size={15} />
                                Bộ lọc
                                {(filters.categoryId || filters.brandId || filters.minPrice || filters.maxPrice || filters.keyword) && (
                                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Active filter chips */}
                    <div className="mt-4">
                        <ActiveFilters
                            filters={filters} categories={categories} brands={brands}
                            onRemove={handleRemoveFilter}
                            onClearAll={() => { handleFilterChange('_reset', ''); setPriceInput({ min: '', max: '' }); }} />
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* ── Desktop sidebar ── */}
                    <aside className="hidden md:block w-64 shrink-0">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
                            <h3 className="flex items-center gap-2 font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">
                                <Filter size={17} /> Bộ lọc
                            </h3>
                            <FilterPanel {...filterPanelProps} />
                        </div>
                    </aside>

                    {/* ── Products area ── */}
                    <main className="flex-1 min-w-0">
                        {/* Grid view */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 mb-10">
                                {loading
                                    ? Array(LIMIT).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                                    : products.length > 0
                                        ? products.map(p => <ProductCard key={p.id} product={p} />)
                                        : <EmptyState onClear={() => handleFilterChange('_reset', '')} />
                                }
                            </div>
                        )}

                        {/* List view */}
                        {viewMode === 'list' && (
                            <div className="space-y-4 mb-10">
                                {loading
                                    ? Array(6).fill(0).map((_, i) => (
                                        <div key={i} className="animate-pulse h-32 bg-white rounded-2xl border border-gray-100" />
                                    ))
                                    : products.length > 0
                                        ? products.map(p => (
                                            <Link key={p.id} href={`/products/${p.id}`}
                                                className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow group">
                                                <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                                                    <img src={p.thumbnail || 'https://placehold.co/200?text=?'}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">
                                                        {p.brandName ?? ''}
                                                    </p>
                                                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:underline underline-offset-2">
                                                        {p.name}
                                                    </h3>
                                                    <p className="text-md text-gray-500 mt-1">{p.categoryName ?? ''}</p>
                                                </div>
                                            </Link>
                                        ))
                                        : <EmptyState onClear={() => handleFilterChange('_reset', '')} />
                                }
                            </div>
                        )}

                        {/* ── Pagination ── */}
                        {!loading && totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 flex-wrap pt-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0}
                                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200
                                        rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900
                                        disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronLeft size={18} />
                                </button>

                                {/* Smart page numbers */}
                                {(() => {
                                    const pages = [];
                                    const showAround = 2;
                                    for (let i = 0; i < totalPages; i++) {
                                        if (
                                            i === 0 || i === totalPages - 1 ||
                                            (i >= page - showAround && i <= page + showAround)
                                        ) {
                                            pages.push(i);
                                        } else if (
                                            i === page - showAround - 1 ||
                                            i === page + showAround + 1
                                        ) {
                                            pages.push('...');
                                        }
                                    }
                                    return [...new Set(pages)].map((p_, idx) =>
                                        p_ === '...' ? (
                                            <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-md">
                                                ···
                                            </span>
                                        ) : (
                                            <button key={p_}
                                                onClick={() => handlePageChange(p_)}
                                                className={`w-10 h-10 rounded-xl font-bold text-md transition-all
                                                    ${page === p_
                                                        ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                                                    }`}>
                                                {p_ + 1}
                                            </button>
                                        )
                                    );
                                })()}

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages - 1}
                                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200
                                        rounded-xl text-gray-600 hover:border-gray-900 hover:text-gray-900
                                        disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ── Mobile filter drawer ── */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMobileFilterOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-black text-gray-900 flex items-center gap-2">
                                <Filter size={17} /> Bộ lọc
                            </h3>
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <FilterPanel {...filterPanelProps} onClose={() => setIsMobileFilterOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Outer wrapper with Suspense (required for useSearchParams in Next.js App Router) ──
export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <RefreshCw size={28} className="animate-spin text-gray-400" />
            </div>
        }>
            <ProductsPageInner />
        </Suspense>
    );
}