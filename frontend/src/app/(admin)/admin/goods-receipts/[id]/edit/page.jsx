'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, PackageOpen, Search, X, Loader2, Filter, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getGoodsReceiptById, updateGoodsReceipt } from '@/services/goodsReceiptService';
import { getProductsWithFilter, getProductById } from '@/services/productService';
import { getBrands } from '@/services/brandService';
import { getCategories } from '@/services/categoryService';

const formatCurrency = (v) =>
    v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '';

export default function EditGoodsReceiptPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [note, setNote] = useState('');
    const [productBlocks, setProductBlocks] = useState([]);

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeBlockId, setActiveBlockId] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const [grnRes, brandsData, categoriesData] = await Promise.all([
                    getGoodsReceiptById(id),
                    getBrands(),
                    getCategories()
                ]);

                setBrands(brandsData?.result || brandsData || []);
                setCategories(categoriesData?.result || categoriesData || []);

                const grn = grnRes?.result;
                if (!grn) { toast.error('Không tìm thấy phiếu nhập!'); router.push('/admin/goods-receipts'); return; }
                if (grn.status === 'CONFIRMED') { toast.error('Không thể sửa phiếu đã xác nhận!'); router.push('/admin/goods-receipts'); return; }

                setNote(grn.note || '');

                // Group items by productId
                const productMap = {};
                for (const item of grn.items) {
                    const productRes = await getProductById(
                        await getProductIdFromSkuCode(item.skuId, item.skuCode)
                    );
                    // Actually get product from sku
                }

                // Rebuild blocks from existing items
                // Group items by product (we need to fetch product details for each sku)
                const skuProductMap = {};
                for (const item of grn.items) {
                    if (!skuProductMap[item.skuId]) {
                        // Fetch product via SKU - we'll use the product name to group
                        skuProductMap[item.skuId] = { productName: item.productName, item };
                    }
                }

                // Create one block per unique product by grouping skus with same product name
                const productGroups = {};
                for (const item of grn.items) {
                    const key = item.productName;
                    if (!productGroups[key]) productGroups[key] = { items: [], productId: null };
                    productGroups[key].items.push(item);
                }

                // For each group, try to fetch full product data
                const blocks = [];
                for (const [productName, group] of Object.entries(productGroups)) {
                    // Search for the product to get full details
                    const searchRes = await getProductsWithFilter({ keyword: productName, limit: 1 });
                    const products = searchRes?.result?.products || searchRes?.products || [];
                    let fullProduct = products.find(p => p.name === productName);

                    if (fullProduct) {
                        const detailRes = await getProductById(fullProduct.id);
                        fullProduct = detailRes?.result || detailRes;
                    }

                    const skuData = {};
                    for (const item of group.items) {
                        skuData[item.skuId] = {
                            received: item.quantityReceived,
                            passed: item.quantityPassed,
                            failed: item.quantityFailed,
                            importPrice: item.importPrice || ''
                        };
                    }

                    blocks.push({
                        id: Date.now() + Math.random(),
                        product: fullProduct || { name: productName, skus: group.items.map(i => ({ id: i.skuId, code: i.skuCode, skuName: i.skuName || i.skuCode, isActive: true, importPrice: i.importPrice })) },
                        skuData
                    });
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

    // Helper to get product ID from sku
    const getProductIdFromSkuCode = async (skuId, skuCode) => {
        // This is a placeholder - in practice the API should return productId
        return null;
    };

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
        } catch { toast.error("Lỗi tìm kiếm!"); }
        finally { setIsSearching(false); }
    };

    const handleSelectProduct = async (productId) => {
        setIsSearching(true);
        try {
            const detailResponse = await getProductById(productId);
            const fullProduct = detailResponse?.result || detailResponse;
            if (fullProduct?.skus) {
                const initialSkuData = {};
                fullProduct.skus.filter(s => s.isActive !== false).forEach(sku => {
                    initialSkuData[sku.id] = { received: '', passed: '', failed: 0, importPrice: '' };
                });
                setProductBlocks(prev => prev.map(block =>
                    block.id === activeBlockId
                        ? { ...block, product: fullProduct, skuData: initialSkuData }
                        : block
                ));
            }
            setIsSearchModalOpen(false);
        } catch { toast.error("Lỗi tải SKU!"); }
        finally { setIsSearching(false); }
    };

    const handleQuantityChange = (blockId, skuId, field, value) => {
        setProductBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const current = block.skuData[skuId];
            const updated = { ...current, [field]: value };
            const received = parseInt(updated.received) || 0;
            let passed = parseInt(updated.passed) || 0;
            if (field === 'passed' && passed > received) { passed = received; updated.passed = passed; toast.warning('SL Đạt QC không thể lớn hơn SL Nhận!'); }
            if (field === 'received' && passed > received) { passed = received; updated.passed = passed; }
            updated.failed = Math.max(0, received - passed);
            return { ...block, skuData: { ...block.skuData, [skuId]: updated } };
        }));
    };

    const handleSave = async () => {
        const finalItems = [];
        for (const block of productBlocks) {
            if (!block.product) continue;
            for (const [skuIdStr, data] of Object.entries(block.skuData)) {
                const received = parseInt(data.received) || 0;
                if (received <= 0) continue;
                const importPrice = parseFloat(data.importPrice);
                if (!importPrice || importPrice <= 0) {
                    toast.error(`Vui lòng nhập giá nhập hợp lệ!`);
                    return;
                }
                finalItems.push({
                    skuId: parseInt(skuIdStr),
                    quantityReceived: received,
                    quantityPassed: parseInt(data.passed) || 0,
                    quantityFailed: parseInt(data.failed) || 0,
                    importPrice
                });
            }
        }
        if (finalItems.length === 0) { toast.error('Vui lòng nhập ít nhất 1 sản phẩm!'); return; }
        setLoading(true);
        try {
            await updateGoodsReceipt(id, { note, items: finalItems });
            toast.success('Cập nhật phiếu nhập thành công!');
            router.push('/admin/goods-receipts');
        } catch (err) {
            toast.error(err.message || 'Lỗi cập nhật phiếu nhập!');
        } finally { setLoading(false); }
    };

    if (initialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    return (
        <div className="p-2 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/goods-receipts" className="text-gray-500 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <PackageOpen size={24} className="text-amber-600" /> Sửa Phiếu Nhập GRN-{String(id).padStart(4, '0')}
                    </h1>
                </div>
                <button onClick={handleSave} disabled={loading} className="bg-amber-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 disabled:opacity-50 font-medium">
                    {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
                </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-md text-amber-800 flex items-start gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>Bạn đang sửa phiếu nhập chưa duyệt. Sau khi duyệt, phiếu sẽ không thể sửa nữa.</span>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <label className="block font-medium mb-2 text-gray-700">Ghi chú</label>
                    <textarea className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" rows="2" value={note} onChange={e => setNote(e.target.value)} />
                </div>

                {productBlocks.map((block, index) => (
                    <div key={block.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-md">SP {index + 1}</span>
                                {block.product ? (
                                    <div>
                                        <h3 className="font-bold text-gray-800">{block.product.name}</h3>
                                        <p className="text-sm text-gray-500">{block.product.brandName} | {block.product.categoryName}</p>
                                    </div>
                                ) : (
                                    <button onClick={() => openSearchModal(block.id)} className="text-blue-600 border border-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50 flex items-center gap-2 text-md font-medium">
                                        <Search size={16} /> Chọn sản phẩm
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {block.product && <button onClick={() => openSearchModal(block.id)} className="text-md text-gray-600 hover:text-blue-600 px-3 py-1 rounded border hover:bg-gray-100">Đổi SP</button>}
                                {productBlocks.length > 1 && (
                                    <button onClick={() => setProductBlocks(p => p.filter(b => b.id !== block.id))} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {block.product && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-md text-left">
                                    <thead className="bg-white text-gray-500 border-b">
                                        <tr>
                                            <th className="p-3 font-medium min-w-[180px]">Phân loại</th>
                                            <th className="p-3 font-medium">Mã SKU</th>
                                            <th className="p-3 font-medium w-28">SL Nhận</th>
                                            <th className="p-3 font-medium w-28 text-green-600">SL Đạt QC</th>
                                            <th className="p-3 font-medium w-20 text-red-600">Lỗi</th>
                                            <th className="p-3 font-medium w-40 text-blue-600">Giá nhập (VNĐ) *</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {(block.product.skus || []).filter(s => s.isActive !== false).map(sku => {
                                            const sData = block.skuData[sku.id] || { received: '', passed: '', failed: 0, importPrice: '' };
                                            const isFilled = parseInt(sData.received) > 0;
                                            return (
                                                <tr key={sku.id} className={`hover:bg-blue-50/20 ${isFilled ? 'bg-blue-50/20' : ''}`}>
                                                    <td className="p-3 font-medium text-gray-800">{sku.skuName || sku.code}</td>
                                                    <td className="p-3 text-gray-500 font-mono text-sm">{sku.code}</td>
                                                    <td className="p-3">
                                                        <input type="number" min="0" className={`w-full border rounded px-2 py-1.5 outline-none text-center ${isFilled ? 'border-blue-400' : 'border-gray-200'}`} value={sData.received} placeholder="0" onChange={e => handleQuantityChange(block.id, sku.id, 'received', e.target.value)} />
                                                    </td>
                                                    <td className="p-3">
                                                        <input type="number" min="0" className={`w-full border rounded px-2 py-1.5 outline-none text-center ${isFilled ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200'}`} value={sData.passed} placeholder="0" onChange={e => handleQuantityChange(block.id, sku.id, 'passed', e.target.value)} disabled={!isFilled} />
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-red-500">{parseInt(sData.failed) > 0 ? sData.failed : '-'}</td>
                                                    <td className="p-3">
                                                        <input type="number" min="0" className={`w-full border rounded px-2 py-1.5 outline-none text-right font-medium ${isFilled ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200'}`} value={sData.importPrice} placeholder="Nhập giá..." onChange={e => handleQuantityChange(block.id, sku.id, 'importPrice', e.target.value)} disabled={!isFilled} />
                                                        {sku.importPrice && <div className="text-sm text-gray-400 text-right mt-1">Bình quân hiện tại: {formatCurrency(sku.importPrice)}</div>}
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

            {/* Search Modal (same as create) */}
            {isSearchModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-20 z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">Tìm kiếm Sản phẩm</h2>
                            <button onClick={() => setIsSearchModalOpen(false)}><X size={24} className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="p-4 border-b space-y-3">
                            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input autoFocus className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" placeholder="Tên sản phẩm..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
                            </form>
                            <div className="flex gap-3">
                                <select className="flex-1 border rounded-lg px-3 py-2 text-md outline-none" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); handleSearch(searchKeyword, selectedBrand, e.target.value); }}>
                                    <option value="">-- Tất cả Danh mục --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select className="flex-1 border rounded-lg px-3 py-2 text-md outline-none" value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); handleSearch(searchKeyword, e.target.value, selectedCategory); }}>
                                    <option value="">-- Tất cả Thương hiệu --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {isSearching ? <div className="flex justify-center py-10 text-gray-500"><Loader2 className="animate-spin" /></div>
                                : searchResults.map(prod => (
                                    <div key={prod.id} className="bg-white p-3 rounded-lg border hover:border-blue-500 cursor-pointer transition-all flex items-center gap-3 mb-2 group" onClick={() => handleSelectProduct(prod.id)}>
                                        <div className="w-12 h-12 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                                            {prod.thumbnail ? <img src={prod.thumbnail} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-sm text-gray-400">Ảnh</span>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold group-hover:text-blue-600">{prod.name}</h4>
                                            <p className="text-sm text-gray-500">{prod.brandName} • {prod.categoryName}</p>
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