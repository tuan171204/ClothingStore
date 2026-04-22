'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Save, Trash2, PackageOpen, Search, X,
    Loader2, DollarSign, AlertTriangle, Building2, ChevronDown, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getGoodsReceiptById, updateGoodsReceipt } from '@/services/goodsReceiptService';
import { getProductsWithFilter, getProductById } from '@/services/productService';
import { getBrands } from '@/services/brandService';
import { getCategories } from '@/services/categoryService';
import { getActiveSuppliersSummary } from '@/services/supplierService';

const formatCurrency = (v) =>
    v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '';

export default function EditGoodsReceiptPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [note, setNote] = useState('');
    const [productBlocks, setProductBlocks] = useState([]);

    // ── Supplier state ──────────────────────────────────
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [supplierError, setSupplierError] = useState('');

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

    // ── Init ──────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [grnRes, brandsData, categoriesData, suppliersData] = await Promise.all([
                    getGoodsReceiptById(id),
                    getBrands(),
                    getCategories(),
                    getActiveSuppliersSummary(),
                ]);

                setBrands(brandsData?.result || brandsData || []);
                setCategories(categoriesData?.result || categoriesData || []);
                setSuppliers(suppliersData || []);

                const grn = grnRes?.result;
                if (!grn) { toast.error('Không tìm thấy phiếu nhập!'); router.push('/admin/goods-receipts'); return; }
                if (grn.status === 'CONFIRMED') { toast.error('Không thể sửa phiếu đã xác nhận!'); router.push('/admin/goods-receipts'); return; }

                setNote(grn.note || '');

                // Pre-fill supplier từ GRN hiện tại
                if (grn.supplierId) {
                    setSelectedSupplierId(String(grn.supplierId));
                }

                // Rebuild product blocks từ items
                const productGroups = {};
                for (const item of grn.items) {
                    const key = item.productName || `product_${item.skuId}`;
                    if (!productGroups[key]) productGroups[key] = { items: [], productName: item.productName };
                    productGroups[key].items.push(item);
                }

                const blocks = [];
                for (const [, group] of Object.entries(productGroups)) {
                    // Tìm product đầy đủ từ API
                    let fullProduct = null;
                    try {
                        const searchRes = await getProductsWithFilter({ keyword: group.productName, limit: 1 });
                        const products = searchRes?.result?.products || searchRes?.products || [];
                        const found = products.find(p => p.name === group.productName);
                        if (found) {
                            const detailRes = await getProductById(found.id);
                            fullProduct = detailRes?.result || detailRes;
                        }
                    } catch {
                        /* fallback: dùng thông tin từ items */
                    }

                    const skuData = {};
                    for (const item of group.items) {
                        skuData[item.skuId] = {
                            received: item.quantityReceived,
                            passed: item.quantityPassed,
                            failed: item.quantityFailed,
                            importPrice: item.importPrice || '',
                        };
                    }

                    // Fallback nếu không fetch được full product
                    if (!fullProduct) {
                        fullProduct = {
                            name: group.productName || 'Sản phẩm không xác định',
                            skus: group.items.map(i => ({
                                id: i.skuId,
                                code: i.skuCode,
                                skuName: i.skuName || i.skuCode,
                                isActive: true,
                                importPrice: i.importPrice,
                            })),
                        };
                    }

                    blocks.push({ id: Date.now() + Math.random(), product: fullProduct, skuData });
                }

                setProductBlocks(blocks.length > 0 ? blocks : [{ id: Date.now(), product: null, skuData: {} }]);
            } catch (err) {
                toast.error('Lỗi tải dữ liệu phiếu nhập!');
            } finally {
                setInitialLoading(false);
            }
        };
        init();
    }, [id]);

    // ── Search ─────────────────────────────────────────────
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
        } catch { toast.error('Lỗi tìm kiếm!'); }
        finally { setIsSearching(false); }
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
        } catch { toast.error('Lỗi tải SKU!'); }
        finally { setIsSearching(false); }
    };

    // ── Quantity ───────────────────────────────────────────
    const handleQuantityChange = (blockId, skuId, field, value) => {
        setProductBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const current = block.skuData[skuId];
            const updated = { ...current, [field]: value };
            const received = parseInt(updated.received) || 0;
            let passed = parseInt(updated.passed) || 0;
            if (field === 'passed' && passed > received) {
                passed = received; updated.passed = passed;
                toast.warning('SL Đạt QC không thể lớn hơn SL Nhận!');
            }
            if (field === 'received' && passed > received) { passed = received; updated.passed = passed; }
            updated.failed = Math.max(0, received - passed);
            return { ...block, skuData: { ...block.skuData, [skuId]: updated } };
        }));
    };

    // ── Save ───────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedSupplierId) {
            setSupplierError('Vui lòng chọn nhà cung cấp');
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
                    toast.error('Vui lòng nhập giá nhập hợp lệ!');
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

        if (finalItems.length === 0) { toast.error('Vui lòng nhập ít nhất 1 sản phẩm!'); return; }

        setLoading(true);
        try {
            await updateGoodsReceipt(id, {
                supplierId: parseInt(selectedSupplierId),
                note,
                items: finalItems,
            });
            toast.success('Cập nhật phiếu nhập thành công!');
            router.push('/admin/goods-receipts');
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || 'Lỗi cập nhật phiếu nhập!');
        } finally {
            setLoading(false);
        }
    };

    const selectedSupplier = suppliers.find(s => String(s.id) === String(selectedSupplierId));

    if (initialLoading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );

    return (
        <div className="p-2 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/goods-receipts" className="text-gray-500 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <PackageOpen size={24} className="text-amber-600" />
                        Sửa Phiếu Nhập GRN-{String(id).padStart(4, '0')}
                    </h1>
                </div>
                <button onClick={handleSave} disabled={loading}
                    className="bg-amber-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 disabled:opacity-50 font-medium">
                    {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
                </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800 flex items-start gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                Bạn đang sửa phiếu nhập chưa duyệt. Sau khi duyệt, phiếu sẽ không thể sửa nữa.
            </div>

            <div className="space-y-6">
                {/* ── SUPPLIER ── */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Building2 size={18} className="text-emerald-600" />
                        Nhà cung cấp <span className="text-red-500">*</span>
                    </h2>
                    <div className="relative">
                        <select
                            value={selectedSupplierId}
                            onChange={e => { setSelectedSupplierId(e.target.value); setSupplierError(''); }}
                            className={`w-full border ${supplierError ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none bg-white`}>
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
                    {selectedSupplier && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                            <Building2 size={18} className="text-emerald-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-emerald-800 text-sm">{selectedSupplier.name}</p>
                                {selectedSupplier.phone && <p className="text-xs text-emerald-600">📞 {selectedSupplier.phone}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Note */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <label className="block font-medium mb-2 text-gray-700 text-sm">Ghi chú</label>
                    <textarea className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2" value={note} onChange={e => setNote(e.target.value)} />
                </div>

                {/* Product blocks */}
                {productBlocks.map((block, index) => (
                    <div key={block.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm">SP {index + 1}</span>
                                {block.product ? (
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">{block.product.name}</h3>
                                        {block.product.brandName && <p className="text-xs text-gray-500">{block.product.brandName} | {block.product.categoryName}</p>}
                                    </div>
                                ) : (
                                    <button onClick={() => openSearchModal(block.id)}
                                        className="text-blue-600 border border-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50 flex items-center gap-2 text-sm font-medium">
                                        <Search size={15} /> Chọn sản phẩm
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {block.product && (
                                    <button onClick={() => openSearchModal(block.id)}
                                        className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1 rounded border hover:bg-gray-100">
                                        Đổi SP
                                    </button>
                                )}
                                {productBlocks.length > 1 && (
                                    <button onClick={() => setProductBlocks(p => p.filter(b => b.id !== block.id))}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-md">
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
                                            <th className="p-3 min-w-[180px]">Phân loại</th>
                                            <th className="p-3">Mã SKU</th>
                                            <th className="p-3 w-28">SL Nhận</th>
                                            <th className="p-3 w-28 text-green-600">SL Đạt QC</th>
                                            <th className="p-3 w-20 text-red-600">Lỗi</th>
                                            <th className="p-3 w-44 text-blue-600">Giá nhập (VNĐ) *</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {(block.product.skus || []).filter(s => s.isActive !== false).map(sku => {
                                            const sData = block.skuData[sku.id] || { received: '', passed: '', failed: 0, importPrice: '' };
                                            const isFilled = parseInt(sData.received) > 0;
                                            return (
                                                <tr key={sku.id} className={`hover:bg-blue-50/20 ${isFilled ? 'bg-blue-50/20' : ''}`}>
                                                    <td className="p-3 font-medium text-gray-800">{sku.skuName || sku.code}</td>
                                                    <td className="p-3 text-gray-400 font-mono text-xs">{sku.code}</td>
                                                    <td className="p-3">
                                                        <input type="number" min="0"
                                                            className={`w-full border rounded px-2 py-1.5 text-center text-sm outline-none ${isFilled ? 'border-blue-400' : 'border-gray-200'}`}
                                                            value={sData.received} placeholder="0"
                                                            onChange={e => handleQuantityChange(block.id, sku.id, 'received', e.target.value)} />
                                                    </td>
                                                    <td className="p-3">
                                                        <input type="number" min="0"
                                                            className={`w-full border rounded px-2 py-1.5 text-center text-sm outline-none font-medium ${isFilled ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200'}`}
                                                            value={sData.passed} placeholder="0"
                                                            onChange={e => handleQuantityChange(block.id, sku.id, 'passed', e.target.value)}
                                                            disabled={!isFilled} />
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-red-500 text-sm">
                                                        {parseInt(sData.failed) > 0 ? sData.failed : '—'}
                                                    </td>
                                                    <td className="p-3">
                                                        <input type="number" min="0"
                                                            className={`w-full border rounded px-2 py-1.5 text-right text-sm outline-none font-medium ${isFilled ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200'}`}
                                                            value={sData.importPrice} placeholder="Nhập giá..."
                                                            onChange={e => handleQuantityChange(block.id, sku.id, 'importPrice', e.target.value)}
                                                            disabled={!isFilled} />
                                                        {sku.importPrice && (
                                                            <p className="text-xs text-gray-400 text-right mt-1">BQ: {formatCurrency(sku.importPrice)}</p>
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
                ))}
            </div>

            {/* Search Modal */}
            {isSearchModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-16 z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[88vh] overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold">Tìm kiếm Sản phẩm</h2>
                            <button onClick={() => setIsSearchModalOpen(false)}><X size={22} className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="p-4 border-b space-y-3">
                            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input autoFocus
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-200 rounded-lg outline-none text-sm"
                                    placeholder="Tên sản phẩm..." value={searchKeyword}
                                    onChange={e => setSearchKeyword(e.target.value)} />
                            </form>
                            <div className="flex gap-3">
                                <select className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none" value={selectedCategory}
                                    onChange={e => { setSelectedCategory(e.target.value); handleSearch(searchKeyword, selectedBrand, e.target.value); }}>
                                    <option value="">-- Tất cả Danh mục --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none" value={selectedBrand}
                                    onChange={e => { setSelectedBrand(e.target.value); handleSearch(searchKeyword, e.target.value, selectedCategory); }}>
                                    <option value="">-- Tất cả Thương hiệu --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {isSearching ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : searchResults.map(prod => (
                                <div key={prod.id}
                                    className="bg-white p-3 rounded-lg border hover:border-blue-500 cursor-pointer transition-all flex items-center gap-3 mb-2 group"
                                    onClick={() => handleSelectProduct(prod.id)}>
                                    <div className="w-12 h-12 bg-gray-100 rounded border overflow-hidden shrink-0">
                                        {prod.thumbnail ? <img src={prod.thumbnail} className="w-full h-full object-cover" alt="" /> : null}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm group-hover:text-blue-600">{prod.name}</p>
                                        <p className="text-xs text-gray-400">{prod.brandName} · {prod.categoryName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}