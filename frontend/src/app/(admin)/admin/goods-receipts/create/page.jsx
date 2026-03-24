'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2, PackageOpen, Search, X, Loader2, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { createGoodsReceipt } from '@/services/goodsReceiptService';
import { getProductsWithFilter, getProductById } from '@/services/productService';
import { getBrands } from '@/services/brandService';
import { getCategories } from '@/services/categoryService';

export default function CreateGoodsReceiptPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Ghi chú phiếu nhập
    const [note, setNote] = useState('');

    // State chính: Quản lý các KHỐI sản phẩm (Matrix Blocks)
    const [productBlocks, setProductBlocks] = useState([
        { id: Date.now(), product: null, skuData: {} }
    ]);

    // ==========================================
    // STATE & LOGIC CHO MODAL TÌM KIẾM SẢN PHẨM
    // ==========================================
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeBlockId, setActiveBlockId] = useState(null);

    // State cho bộ lọc
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);

    // State kết quả tìm kiếm
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Load danh sách Brand và Category khi component mount
    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const [brandsData, categoriesData] = await Promise.all([
                    getBrands(),
                    getCategories()
                ]);
                setBrands(brandsData?.result || brandsData || []);
                setCategories(categoriesData?.result || categoriesData || []);
            } catch (error) {
                console.error("Lỗi tải bộ lọc:", error);
            }
        };
        fetchFiltersData();
    }, []);

    const openSearchModal = (blockId) => {
        setActiveBlockId(blockId);
        setIsSearchModalOpen(true);
        if (searchResults.length === 0) handleSearch('', '', ''); // Tải sẵn một vài sản phẩm
    };

    const handleSearch = async (keyword = searchKeyword, brandId = selectedBrand, categoryId = selectedCategory) => {
        setIsSearching(true);
        try {
            // Build params động theo API của Backend
            const params = { limit: 10, page: 0 };
            if (keyword) params.keyword = keyword;
            if (brandId) params.brandId = brandId;
            if (categoryId) params.categoryId = categoryId;

            const data = await getProductsWithFilter(params);
            const products = data?.result?.products || data?.products || data?.result?.content || [];
            setSearchResults(products);
        } catch (error) {
            toast.error("Lỗi khi tìm kiếm sản phẩm!");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectProduct = async (productId) => {
        setIsSearching(true);
        try {
            const detailResponse = await getProductById(productId);
            const fullProduct = detailResponse?.result || detailResponse;

            if (fullProduct && fullProduct.skus) {
                const initialSkuData = {};
                fullProduct.skus.forEach(sku => {
                    initialSkuData[sku.id] = { received: 0, passed: 0, failed: 0 };
                });

                setProductBlocks(prev => prev.map(block =>
                    block.id === activeBlockId
                        ? { ...block, product: fullProduct, skuData: initialSkuData }
                        : block
                ));
            }
            setIsSearchModalOpen(false);
        } catch (error) {
            toast.error("Lỗi khi tải chi tiết phân loại (SKU)!");
        } finally {
            setIsSearching(false);
        }
    };

    // ==========================================
    // LOGIC NHẬP LIỆU & TÍNH TOÁN MA TRẬN
    // ==========================================
    const handleAddBlock = () => {
        setProductBlocks([...productBlocks, { id: Date.now(), product: null, skuData: {} }]);
    };

    const handleRemoveBlock = (blockId) => {
        if (productBlocks.length === 1) {
            toast.warning('Phiếu nhập phải có ít nhất 1 sản phẩm!');
            return;
        }
        setProductBlocks(productBlocks.filter(b => b.id !== blockId));
    };

    const handleQuantityChange = (blockId, skuId, field, value) => {
        setProductBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;

            const currentSkuData = block.skuData[skuId];
            const updatedSkuData = { ...currentSkuData, [field]: value };

            const received = parseInt(updatedSkuData.received) || 0;
            let passed = parseInt(updatedSkuData.passed) || 0;

            if (field === 'passed' && passed > received) {
                passed = received;
                updatedSkuData.passed = passed;
                toast.warning('SL Đạt QC không thể lớn hơn SL Nhận!');
            }
            if (field === 'received' && passed > received) {
                passed = received;
                updatedSkuData.passed = passed;
            }

            updatedSkuData.failed = Math.max(0, received - passed);

            return {
                ...block,
                skuData: { ...block.skuData, [skuId]: updatedSkuData }
            };
        }));
    };

    // ==========================================
    // XỬ LÝ GỬI FORM (SUBMIT)
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalItems = [];

        productBlocks.forEach(block => {
            if (block.product) {
                Object.entries(block.skuData).forEach(([skuIdStr, data]) => {
                    if (data.received > 0) {
                        finalItems.push({
                            skuId: parseInt(skuIdStr),
                            quantityReceived: data.received,
                            quantityPassed: data.passed,
                            quantityFailed: data.failed
                        });
                    }
                });
            }
        });

        if (finalItems.length === 0) {
            toast.error('Vui lòng nhập số lượng nhận (>0) cho ít nhất 1 phân loại (SKU) !');
            return;
        }

        const payload = { note, items: finalItems };

        setLoading(true);
        try {
            await createGoodsReceipt(payload);
            toast.success('Tạo phiếu nhập kho thành công! Chờ quản lý duyệt.');
            router.push('/admin/goods-receipts');
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra khi tạo phiếu nhập!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-2 max-w-7xl mx-auto relative">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/goods-receipts" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <PackageOpen size={24} className="text-blue-600" /> Tạo Phiếu Nhập Kho (Matrix)
                    </h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-blue-400 font-medium"
                >
                    {loading ? 'Đang xử lý...' : <><Save size={18} /> Lưu phiếu nhập</>}
                </button>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <label className="block text-gray-700 font-medium mb-2">Ghi chú chung</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2" placeholder="VD: Nhập hàng đợt 1..."
                        value={note} onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                </div>

                {productBlocks.map((block, index) => (
                    <div key={block.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">SP {index + 1}</span>
                                {block.product ? (
                                    <div>
                                        <h3 className="font-bold text-gray-800">{block.product.name}</h3>
                                        <p className="text-xs text-gray-500">Thương hiệu: {block.product.brandName} | Danh mục: {block.product.categoryName}</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => openSearchModal(block.id)}
                                        className="text-blue-600 border border-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Search size={16} /> Chọn sản phẩm từ hệ thống
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {block.product && (
                                    <button onClick={() => openSearchModal(block.id)} className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1 rounded border hover:bg-gray-100">Đổi SP khác</button>
                                )}
                                <button onClick={() => handleRemoveBlock(block.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors" title="Xóa khối sản phẩm này">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {block.product && (
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-white text-gray-500 border-b">
                                        <tr>
                                            <th className="p-3 font-medium min-w-[200px]">Phân loại (Màu / Size)</th>
                                            <th className="p-3 font-medium">Mã SKU</th>
                                            <th className="p-3 font-medium w-32">SL Nhận</th>
                                            <th className="p-3 font-medium w-32 text-green-600">SL Đạt QC</th>
                                            <th className="p-3 font-medium w-24 text-red-600">SL Lỗi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {block.product.skus?.map(sku => {
                                            const sData = block.skuData[sku.id] || { received: 0, passed: 0, failed: 0 };
                                            const isFilled = sData.received > 0;

                                            return (
                                                <tr key={sku.id} className={`hover:bg-blue-50/30 transition-colors ${isFilled ? 'bg-blue-50/50' : ''}`}>
                                                    <td className="p-3 font-medium text-gray-800">{sku.skuName}</td>
                                                    <td className="p-3 text-gray-500 font-mono text-xs">{sku.code}</td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number" min="0"
                                                            className={`w-full border rounded-md px-3 py-2 outline-none text-center ${isFilled ? 'border-blue-400 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 focus:border-blue-400'}`}
                                                            value={sData.received || ''}
                                                            placeholder="0"
                                                            onChange={(e) => handleQuantityChange(block.id, sku.id, 'received', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number" min="0"
                                                            className={`w-full border rounded-md px-3 py-2 outline-none text-center font-medium ${isFilled ? 'bg-green-50 text-green-700 border-green-300 focus:ring-2 focus:ring-green-500' : 'border-gray-200'}`}
                                                            value={sData.passed || ''}
                                                            placeholder="0"
                                                            onChange={(e) => handleQuantityChange(block.id, sku.id, 'passed', e.target.value)}
                                                            disabled={!isFilled}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-red-500">
                                                        {sData.failed > 0 ? sData.failed : '-'}
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

                <button
                    onClick={handleAddBlock}
                    className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-center items-center gap-2 font-medium"
                >
                    <Plus size={20} /> Thêm Sản phẩm khác vào phiếu
                </button>
            </div>

            {/* ========================================== */}
            {/* MODAL TÌM KIẾM & LỌC SẢN PHẨM */}
            {/* ========================================== */}
            {isSearchModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-start pt-20 z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-top-4">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Filter size={20} className="text-blue-600" /> Tìm kiếm & Chọn Sản phẩm
                            </h2>
                            <button onClick={() => setIsSearchModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Khu vực Nhập từ khóa & Filter */}
                        <div className="p-4 border-b bg-white space-y-3">
                            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text" autoFocus
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg outline-none transition-all"
                                    placeholder="Nhập tên sản phẩm để tìm kiếm..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                />
                            </form>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm focus:ring-2 focus:ring-blue-500"
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        // Tự động tìm kiếm ngay khi thay đổi filter
                                        handleSearch(searchKeyword, selectedBrand, e.target.value);
                                    }}
                                >
                                    <option value="">-- Tất cả Danh mục --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>

                                <select
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm focus:ring-2 focus:ring-blue-500"
                                    value={selectedBrand}
                                    onChange={(e) => {
                                        setSelectedBrand(e.target.value);
                                        handleSearch(searchKeyword, e.target.value, selectedCategory);
                                    }}
                                >
                                    <option value="">-- Tất cả Thương hiệu --</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => handleSearch()}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
                                >
                                    Lọc
                                </button>
                            </div>
                        </div>

                        {/* Kết quả tìm kiếm */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {isSearching ? (
                                <div className="flex justify-center items-center py-10 text-gray-500">
                                    <Loader2 className="animate-spin mr-2" /> Đang lấy dữ liệu...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {searchResults.map(prod => (
                                        <div
                                            key={prod.id}
                                            className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                                            onClick={() => handleSelectProduct(prod.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                                                    {prod.thumbnail ? (
                                                        <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full text-xs text-gray-400">Ảnh</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1" title={prod.name}>{prod.name}</h4>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded mr-1">{prod.brandName || 'N/A'}</span>
                                                        <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded">{prod.categoryName || 'N/A'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}