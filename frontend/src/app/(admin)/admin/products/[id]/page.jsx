'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { formatCurrency } from '@/services/productService';
import {
    Edit, Trash2, ArrowLeft, Package, DollarSign,
    TrendingUp, BarChart3, Globe, Tag, Layers,
    CheckCircle2, XCircle, ImageIcon, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

/**
 * Tính khoảng giá từ SKUs
 */
function getPriceRange(skus) {
    if (!skus || skus.length === 0) return null;
    const prices = skus.filter(s => s.price != null && s.price > 0).map(s => Number(s.price));
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

/**
 * Lấy khoảng giá nhập trung bình
 */
function getImportPriceRange(skus) {
    if (!skus || skus.length === 0) return null;
    const prices = skus.filter(s => s.importPrice != null && s.importPrice > 0).map(s => Number(s.importPrice));
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

/**
 * Badge trạng thái tồn kho
 */
function StockBadge({ qty }) {
    if (qty > 10) return (
        <span className="px-2 py-1 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">{qty}</span>
    );
    if (qty > 0) return (
        <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">{qty}</span>
    );
    return (
        <span className="px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">0 — Hết</span>
    );
}

export default function AdminProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`/products/${id}`);
                setProduct(res.data);
            } catch (error) {
                console.error("Lỗi:", error);
                toast.error("Không tìm thấy sản phẩm");
                router.push('/admin/products');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id, router]);

    const handleDelete = async () => {
        if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await axios.delete(`/products/${id}`);
            toast.success("Đã xóa sản phẩm");
            router.push('/admin/products');
        } catch (error) {
            toast.error("Lỗi khi xóa (Có thể do đang có đơn hàng liên quan)");
        }
    };

    if (loading) return (
        <div className="p-10 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Đang tải dữ liệu sản phẩm...</p>
        </div>
    );

    if (!product) return null;

    // ─── Tính toán thống kê ───────────────────────────────────────
    const skus = product.skus || [];
    const activeSkus = skus.filter(s => s.isActive !== false);
    const totalStock = skus.reduce((sum, sku) => sum + (sku.stockQuantity || 0), 0);
    const priceRange = getPriceRange(skus);
    const importRange = getImportPriceRange(skus);
    const outOfStockCount = skus.filter(s => (s.stockQuantity || 0) === 0).length;
    const avgMargin = skus.length > 0
        ? (skus.reduce((sum, s) => sum + (Number(s.profitMargin) || 0), 0) / skus.length).toFixed(1)
        : 0;

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

            {/* ── BREADCRUMB + HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Link
                        href="/admin/products"
                        className="mt-1 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h1>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${product.isActive
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>
                                {product.isActive ? '● Đang kinh doanh' : '● Đã ẩn'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
                            <span className="font-mono text-gray-400">#{product.id}</span>
                            {product.categoryName && (
                                <span className="flex items-center gap-1">
                                    <Layers size={12} className="text-gray-400" />
                                    {product.categoryName}
                                </span>
                            )}
                            {product.brandName && (
                                <span className="flex items-center gap-1">
                                    <Tag size={12} className="text-gray-400" />
                                    {product.brandName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0 ml-10 md:ml-0">
                    <Link
                        href={`/products/${product.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        <Globe size={15} /> Xem Shop
                    </Link>
                    <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-sm transition-colors"
                    >
                        <Edit size={15} /> Chỉnh sửa
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* ── METRICS CARDS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <MetricCard
                    icon={<Package size={20} className="text-blue-500" />}
                    label="Tổng tồn kho"
                    value={totalStock}
                    sub={outOfStockCount > 0 ? `${outOfStockCount} biến thể hết hàng` : 'Tất cả còn hàng'}
                    subColor={outOfStockCount > 0 ? 'text-amber-600' : 'text-green-600'}
                    bg="bg-blue-50"
                />
                <MetricCard
                    icon={<TrendingUp size={20} className="text-purple-500" />}
                    label="Biến thể"
                    value={`${activeSkus.length}/${skus.length}`}
                    sub={`${skus.length - activeSkus.length} biến thể ẩn`}
                    subColor="text-gray-400"
                    bg="bg-purple-50"
                />
                <MetricCard
                    icon={<DollarSign size={20} className="text-green-500" />}
                    label="Khoảng giá bán"
                    value={priceRange || '—'}
                    sub="Tất cả biến thể"
                    subColor="text-gray-400"
                    bg="bg-green-50"
                    smallValue
                />
                <MetricCard
                    icon={<BarChart3 size={20} className="text-orange-500" />}
                    label="Lợi nhuận TB"
                    value={`${avgMargin}%`}
                    sub={importRange ? `Nhập: ${importRange}` : 'Chưa nhập hàng'}
                    subColor="text-gray-400"
                    bg="bg-orange-50"
                />
            </div>

            {/* ── MAIN CONTENT GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* CỘT TRÁI: SKU TABLE */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ─── SKU TABLE ─────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-800">Danh sách biến thể (SKU)</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{skus.length} biến thể · {activeSkus.length} đang kinh doanh</p>
                            </div>
                            {outOfStockCount > 0 && (
                                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full font-semibold">
                                    <AlertTriangle size={11} /> {outOfStockCount} hết hàng
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase text-xs border-b border-gray-100">
                                    <tr>
                                        <th className="px-5 py-3">Ảnh</th>
                                        <th className="px-5 py-3">Biến thể</th>
                                        <th className="px-5 py-3 font-mono">Mã SKU</th>
                                        <th className="px-5 py-3 text-right">Giá nhập</th>
                                        <th className="px-5 py-3 text-right">Giá bán</th>
                                        <th className="px-5 py-3 text-right">Lợi nhuận</th>
                                        <th className="px-5 py-3 text-center">Tồn kho</th>
                                        <th className="px-5 py-3 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {skus.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-10 text-center text-gray-400 text-sm">
                                                Chưa có biến thể nào
                                            </td>
                                        </tr>
                                    ) : skus.map((sku) => {
                                        const isHidden = sku.isActive === false;
                                        return (
                                            <tr
                                                key={sku.id}
                                                className={`hover:bg-gray-50 transition-colors ${isHidden ? 'opacity-50' : ''}`}
                                            >
                                                {/* Ảnh */}
                                                <td className="px-5 py-3">
                                                    <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                                        {sku.imgUrl
                                                            ? <img src={sku.imgUrl} alt={sku.skuName} className="w-full h-full object-cover" />
                                                            : <ImageIcon size={14} className="text-gray-300" />
                                                        }
                                                    </div>
                                                </td>

                                                {/* Tên biến thể */}
                                                <td className="px-5 py-3 font-medium text-gray-800">
                                                    {sku.skuName || sku.optionValues?.map(v => v.value).join(' - ') || '—'}
                                                </td>

                                                {/* Mã SKU */}
                                                <td className="px-5 py-3 font-mono text-xs text-gray-500">
                                                    {sku.code}
                                                </td>

                                                {/* Giá nhập */}
                                                <td className="px-5 py-3 text-right text-gray-500">
                                                    {sku.importPrice ? formatCurrency(sku.importPrice) : <span className="text-gray-300">—</span>}
                                                </td>

                                                {/* Giá bán */}
                                                <td className="px-5 py-3 text-right font-bold text-blue-600">
                                                    {sku.price ? formatCurrency(sku.price) : <span className="text-gray-300 font-normal">Chưa có</span>}
                                                </td>

                                                {/* Lợi nhuận % */}
                                                <td className="px-5 py-3 text-right">
                                                    {sku.profitMargin != null ? (
                                                        <span className={`font-semibold text-sm ${Number(sku.profitMargin) >= 20 ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {Number(sku.profitMargin).toFixed(1)}%
                                                        </span>
                                                    ) : <span className="text-gray-300">—</span>}
                                                </td>

                                                {/* Tồn kho */}
                                                <td className="px-5 py-3 text-center">
                                                    <StockBadge qty={sku.stockQuantity || 0} />
                                                </td>

                                                {/* Trạng thái */}
                                                <td className="px-5 py-3 text-center">
                                                    {isHidden ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-semibold">
                                                            <XCircle size={11} /> Ẩn
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-semibold">
                                                            <CheckCircle2 size={11} /> Đang bán
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Footer: tổng tồn kho */}
                                {skus.length > 0 && (
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan={6} className="px-5 py-3 text-sm font-bold text-gray-600 text-right">Tổng tồn kho:</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="font-bold text-gray-800">{totalStock}</span>
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* ─── OPTIONS ────────────────────────────── */}
                    {product.options && product.options.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-bold text-gray-800 mb-4">Thuộc tính sản phẩm</h2>
                            <div className="space-y-3">
                                {product.options.map(opt => (
                                    <div key={opt.id} className="flex items-start gap-4">
                                        <span className="text-sm font-semibold text-gray-600 min-w-[100px] pt-1">
                                            {opt.name}:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {opt.values?.filter(v => v.isActive !== false).map(val => (
                                                <span
                                                    key={val.id}
                                                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full font-medium border border-gray-200"
                                                >
                                                    {val.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI */}
                <div className="space-y-5">

                    {/* Ảnh đại diện */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide text-gray-500">Ảnh đại diện</h2>
                        <div className="aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                            {product.thumbnail ? (
                                <img
                                    src={product.thumbnail}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-300">
                                    <ImageIcon size={40} />
                                    <p className="text-xs">Chưa có ảnh</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ảnh biến thể */}
                    {skus.some(s => s.imgUrl) && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide text-gray-500">Ảnh biến thể</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {skus.filter(s => s.imgUrl).map(s => (
                                    <div key={s.id} className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative group">
                                        <img src={s.imgUrl} alt={s.skuName} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                                            {s.skuName || s.code}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mô tả */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide text-gray-500">Mô tả sản phẩm</h2>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100 max-h-64 overflow-y-auto">
                            {product.description || <span className="text-gray-400 italic">Chưa có mô tả.</span>}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
                        <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide text-gray-500">Thao tác nhanh</h2>
                        <Link
                            href={`/admin/products/edit/${product.id}`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                        >
                            <Edit size={15} /> Chỉnh sửa sản phẩm
                        </Link>
                        <Link
                            href={`/products/${product.id}`}
                            target="_blank"
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                        >
                            <Globe size={15} /> Xem ngoài trang Shop
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={15} /> Xóa sản phẩm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── MetricCard ───────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, subColor = 'text-gray-400', bg, smallValue = false }) {
    return (
        <div className={`${bg} rounded-xl p-4 border border-white shadow-sm flex items-start gap-3`}>
            <div className="p-2.5 bg-white/70 rounded-xl shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 truncate">{label}</p>
                <p className={`font-bold text-gray-900 leading-tight truncate ${smallValue ? 'text-sm' : 'text-xl'}`}>{value}</p>
                {sub && <p className={`text-xs mt-1 ${subColor} truncate`}>{sub}</p>}
            </div>
        </div>
    );
}