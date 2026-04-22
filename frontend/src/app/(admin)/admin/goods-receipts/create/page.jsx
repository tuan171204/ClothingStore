'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Plus, Save, Trash2, PackageOpen,
    Search, X, Loader2, DollarSign, Building2, ChevronDown, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { createGoodsReceipt } from '@/services/goodsReceiptService';
import { getProductsWithFilter, getProductById } from '@/services/productService';
import { getBrands } from '@/services/brandService';
import { getCategories } from '@/services/categoryService';
import { getActiveSuppliersSummary } from '@/services/supplierService';

const formatCurrency = (v) =>
    v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '';

export default function CreateGoodsReceiptPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState('');

    // ── Supplier state ──────────────────────────────────
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [supplierError, setSupplierError] = useState('');

    // ── Product blocks ──────────────────────────────────
    const [productBlocks, setProductBlocks] = useState([
        { id: Date.now(), product: null, skuData: {} }
    ]);

    // ── Search modal state ──────────────────────────────
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeBlockId, setActiveBlockId] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // ── Init ─────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [brandsData, categoriesData, suppliersData] = await Promise.all([
                    getBrands(),
                    getCategories(),
                    getActiveSuppliersSummary(),
                ]);
                setBrands(brandsData?.result || brandsData || []);
                setCategories(categoriesData?.result || categoriesData || []);
                setSuppliers(suppliersData || []);
            } catch {
                toast.error('Lỗi tải dữ liệu ban đầu!');
            }
        };
        init();
    }, []);

    // ── Search product ────────────────────────────────────
    const openSearchModal = (blockId) => {
        setActiveBlockId(blockId);
        setIsSearchModalOpen(true);
        if (searchResults.length === 0) handleSearch('', '', '');
    };

    const handleSearch = async (keyword = searchKeyword, brandId = selectedBrand, categoryId = selectedCategory) => {
        setIsSearching(true);
        try {
            const params = { limit: 10, page: 0 };
            if (keyword) params.keyword = keyword;
            if (brandId) params.brandId = brandId;
            if (categoryId) params.categoryId = categoryId;
            const data = await getProductsWithFilter(params);
            setSearchResults(data?.result?.products || data?.products || []);
        } catch {
            toast.error('Lỗi tìm kiếm sản phẩm!');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectProduct = async (productId) => {
        setIsSearching(true);
        try {
            const detailRes = await getProductById(productId);
            const fullProduct = detailRes?.result || detailRes;
            if (fullProduct?.skus) {
                const initialSkuData = {};
                fullProduct.skus.filter(s => s.isActive !== false).forEach(sku => {
                    initialSkuData[sku.id] = { received: '', passed: '', failed: 0, importPrice: '' };
                });
                setProductBlocks(prev => prev.map(b =>
                    b.id === activeBlockId ? { ...b, product: fullProduct, skuData: initialSkuData } : b
                ));
            }
            setIsSearchModalOpen(false);
        } catch {
            toast.error('Lỗi tải chi tiết SKU!');
        } finally {
            setIsSearching(false);
        }
    };

    // ── Quantity ──────────────────────────────────────────
    const handleQuantityChange = (blockId, skuId, field, value) => {
        setProductBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const current = block.skuData[skuId];
            const updated = { ...current, [field]: value };
            const received = parseInt(updated.received) || 0;
            let passed = parseInt(updated.passed) || 0;
            if (field === 'passed' && passed > received) {
                passed = received;
                updated.passed = passed;
                toast.warning('SL Đạt QC không thể lớn hơn SL Nhận!');
            }
            if (field === 'received' && passed > received) {
                passed = received;
                updated.passed = passed;
            }
            updated.failed = Math.max(0, received - passed);
            return { ...block, skuData: { ...block.skuData, [skuId]: updated } };
        }));
    };

    // ── Submit ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate supplier
        if (!selectedSupplierId) {
            setSupplierError('Vui lòng chọn nhà cung cấp cho phiếu nhập này');
            document.getElementById('supplier-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSupplierError('');

        const finalItems = [];
        for (const block of productBlocks) {
            if (!block.product) continue;
            for (const [skuIdStr, data] of Object.entries(block.skuData)) {
                const received = parseInt(data.received) || 0;
                if (received <= 0) continue;
                const importPrice = parseFloat(data.importPrice);
                if (!importPrice || importPrice <= 0) {
                    toast.error(`Vui lòng nhập giá nhập hợp lệ cho SKU trong "${block.product.name}"!`);
                    return;
                }
                finalItems.push({
                    skuId: parseInt(skuIdStr),
                    quantityReceived: received,
                    quantityPassed: parseInt(data.passed) || 0,
                    quantityFailed: parseInt(data.failed) || 0,
                    importPrice,
                });
            }
        }

        if (finalItems.length === 0) {
            toast.error('Vui lòng nhập số lượng và giá nhập cho ít nhất 1 SKU!');
            return;
        }

        setLoading(true);
        try {
            await createGoodsReceipt({
                supplierId: parseInt(selectedSupplierId),
                note,
                items: finalItems,
            });
            toast.success('Tạo phiếu nhập thành công! Chờ quản lý duyệt.');
            router.push('/admin/goods-receipts');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo phiếu nhập!');
        } finally {
            setLoading(false);
        }
    };

    // ── Selected supplier display ─────────────────────────
    const selectedSupplier = suppliers.find(s => String(s.id) === String(selectedSupplierId));

    return (
        <div className="p-2 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/goods-receipts" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <PackageOpen size={24} className="text-blue-600" /> Tạo Phiếu Nhập Kho
                    </h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-blue-400 font-medium">
                    {loading ? 'Đang xử lý...' : <><Save size={18} /> Lưu phiếu nhập</>}
                </button>
            </div>

            {/* Pricing note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800 flex items-start gap-3">
                <DollarSign size={18} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                    <strong>Lưu ý về giá nhập:</strong> Giá nhập bình quân (WAC) được tính tự động khi duyệt phiếu.
                    Công thức: <em>(Tồn × Giá cũ + Nhập mới × Giá mới) ÷ Tổng số lượng</em>.
                    Giá bán tự động cập nhật nếu SKU đã cài tỷ lệ lợi nhuận.
                </div>
            </div>

            <div className="space-y-6">
                {/* ── SUPPLIER SECTION ── */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Building2 size={18} className="text-emerald-600" />
                        Nhà cung cấp <span className="text-red-500">*</span>
                    </h2>

                    {suppliers.length === 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-md font-semibold text-red-700">Chưa có nhà cung cấp nào</p>
                                <p className="text-md text-red-600 mt-1">
                                    Vui lòng{' '}
                                    <Link href="/admin/suppliers" className="underline font-medium">
                                        thêm nhà cung cấp
                                    </Link>{' '}
                                    trước khi tạo phiếu nhập.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div id="supplier-select" className="relative">
                                <select
                                    value={selectedSupplierId}
                                    onChange={e => { setSelectedSupplierId(e.target.value); setSupplierError(''); }}
                                    className={`w-full border ${supplierError ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:ring-emerald-400'} rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 appearance-none bg-white`}
                                >
                                    <option value="">-- Chọn nhà cung cấp --</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}{s.contactPerson ? ` — ${s.contactPerson}` : ''}{s.phone ? ` (${s.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>

                            {supplierError && (
                                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={12} /> {supplierError}
                                </p>
                            )}

                            {/* Supplier info card khi đã chọn */}
                            {selectedSupplier && (
                                <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Building2 size={18} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-emerald-800 text-md">{selectedSupplier.name}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                                            {selectedSupplier.contactPerson && (
                                                <span className="text-sm text-emerald-600">👤 {selectedSupplier.contactPerson}</span>
                                            )}
                                            {selectedSupplier.phone && (
                                                <span className="text-sm text-emerald-600">📞 {selectedSupplier.phone}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── NOTE ── */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Ghi chú chung</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2"
                        placeholder="VD: Nhập hàng đợt 1 từ NCC ABC..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                {/* ── PRODUCT BLOCKS ── */}
                {productBlocks.map((block, index) => (
                    <ProductBlock
                        key={block.id}
                        block={block}
                        index={index}
                        onOpenSearch={() => openSearchModal(block.id)}
                        onRemove={() => {
                            if (productBlocks.length === 1) { toast.warning('Phiếu nhập phải có ít nhất 1 sản phẩm!'); return; }
                            setProductBlocks(p => p.filter(b => b.id !== block.id));
                        }}
                        onQuantityChange={handleQuantityChange}
                        showRemove={productBlocks.length > 1}
                    />
                ))}

                {/* Add block button */}
                <button
                    onClick={() => setProductBlocks(prev => [...prev, { id: Date.now(), product: null, skuData: {} }])}
                    className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-center items-center gap-2 font-medium text-sm">
                    <Plus size={20} /> Thêm sản phẩm khác vào phiếu
                </button>
            </div>

            {/* ── SEARCH MODAL ── */}
            {isSearchModalOpen && (
                <SearchModal
                    searchKeyword={searchKeyword}
                    setSearchKeyword={setSearchKeyword}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    selectedBrand={selectedBrand}
                    setSelectedBrand={setSelectedBrand}
                    categories={categories}
                    brands={brands}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    onSearch={handleSearch}
                    onSelect={handleSelectProduct}
                    onClose={() => setIsSearchModalOpen(false)}
                />
            )}
        </div>
    );
}

// ─── ProductBlock sub-component ───────────────────────────
function ProductBlock({ block, index, onOpenSearch, onRemove, onQuantityChange, showRemove }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">SP {index + 1}</span>
                    {block.product ? (
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">{block.product.name}</h3>
                            <p className="text-xs text-gray-500">{block.product.brandName} | {block.product.categoryName}</p>
                        </div>
                    ) : (
                        <button onClick={onOpenSearch}
                            className="text-blue-600 border border-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50 flex items-center gap-2 text-sm font-medium">
                            <Search size={15} /> Chọn sản phẩm
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {block.product && (
                        <button onClick={onOpenSearch}
                            className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1 rounded border hover:bg-gray-100">
                            Đổi SP
                        </button>
                    )}
                    {showRemove && (
                        <button onClick={onRemove}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {block.product && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b text-xs uppercase tracking-wide">
                            <tr>
                                <th className="p-3 min-w-[180px]">Phân loại (SKU)</th>
                                <th className="p-3">Mã SKU</th>
                                <th className="p-3 w-28">SL Nhận</th>
                                <th className="p-3 w-28 text-green-600">SL Đạt QC</th>
                                <th className="p-3 w-20 text-red-600">SL Lỗi</th>
                                <th className="p-3 w-44 text-blue-600">Giá nhập (VNĐ) *</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {block.product.skus?.filter(s => s.isActive !== false).map(sku => {
                                const sData = block.skuData[sku.id] || { received: '', passed: '', failed: 0, importPrice: '' };
                                const isFilled = parseInt(sData.received) > 0;
                                return (
                                    <tr key={sku.id} className={`hover:bg-blue-50/20 ${isFilled ? 'bg-blue-50/20' : ''}`}>
                                        <td className="p-3 font-medium text-gray-800">{sku.skuName || sku.code}</td>
                                        <td className="p-3 text-gray-400 font-mono text-xs">{sku.code}</td>
                                        <td className="p-3">
                                            <input type="number" min="0"
                                                className={`w-full border rounded-md px-2.5 py-2 outline-none text-center text-sm ${isFilled ? 'border-blue-400 focus:ring-2 focus:ring-blue-300' : 'border-gray-200'}`}
                                                value={sData.received} placeholder="0"
                                                onChange={e => onQuantityChange(block.id, sku.id, 'received', e.target.value)} />
                                        </td>
                                        <td className="p-3">
                                            <input type="number" min="0"
                                                className={`w-full border rounded-md px-2.5 py-2 outline-none text-center text-sm font-medium ${isFilled ? 'bg-green-50 text-green-700 border-green-300' : 'border-gray-200'}`}
                                                value={sData.passed} placeholder="0"
                                                onChange={e => onQuantityChange(block.id, sku.id, 'passed', e.target.value)}
                                                disabled={!isFilled} />
                                        </td>
                                        <td className="p-3 text-center font-bold text-red-500 text-sm">
                                            {parseInt(sData.failed) > 0 ? sData.failed : '—'}
                                        </td>
                                        <td className="p-3">
                                            <input type="number" min="0"
                                                className={`w-full border rounded-md px-2.5 py-2 outline-none text-right text-sm font-medium ${isFilled ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200'}`}
                                                value={sData.importPrice} placeholder="Nhập giá..."
                                                onChange={e => onQuantityChange(block.id, sku.id, 'importPrice', e.target.value)}
                                                disabled={!isFilled} />
                                            {sku.importPrice && (
                                                <p className="text-xs text-gray-400 text-right mt-1">
                                                    BQ hiện tại: {formatCurrency(sku.importPrice)}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── SearchModal sub-component ────────────────────────────
function SearchModal({
    searchKeyword, setSearchKeyword,
    selectedCategory, setSelectedCategory,
    selectedBrand, setSelectedBrand,
    categories, brands,
    searchResults, isSearching,
    onSearch, onSelect, onClose
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-16 z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Tìm kiếm Sản phẩm</h2>
                    <button onClick={onClose}><X size={22} className="text-gray-400 hover:text-red-500" /></button>
                </div>
                <div className="p-4 border-b space-y-3 bg-white">
                    <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input autoFocus
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-200 rounded-lg outline-none text-sm"
                            placeholder="Nhập tên sản phẩm..."
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)} />
                    </form>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            value={selectedCategory}
                            onChange={e => { setSelectedCategory(e.target.value); onSearch(searchKeyword, selectedBrand, e.target.value); }}>
                            <option value="">-- Tất cả Danh mục --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            value={selectedBrand}
                            onChange={e => { setSelectedBrand(e.target.value); onSearch(searchKeyword, e.target.value, selectedCategory); }}>
                            <option value="">-- Tất cả Thương hiệu --</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <button onClick={() => onSearch()}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 whitespace-nowrap">
                            Lọc
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {isSearching ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {searchResults.map(prod => (
                                <div key={prod.id}
                                    className="bg-white p-3 rounded-lg border hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-center gap-3 group"
                                    onClick={() => onSelect(prod.id)}>
                                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden border shrink-0">
                                        {prod.thumbnail
                                            ? <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                                            : <span className="flex items-center justify-center h-full text-xs text-gray-400">Ảnh</span>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 group-hover:text-blue-600 text-sm line-clamp-1">{prod.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{prod.brandName} · {prod.categoryName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">Không tìm thấy sản phẩm phù hợp</div>
                    )}
                </div>
            </div>
        </div>
    );
}