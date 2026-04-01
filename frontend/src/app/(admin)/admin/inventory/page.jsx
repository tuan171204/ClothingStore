'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, DollarSign, Activity, Settings, Edit3, X, ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2, Search } from 'lucide-react';
import { getBrands } from '@/services/brandService';
import { getCategories } from '@/services/categoryService';
import { toast } from 'react-toastify';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
    getStockOnHand, getInventoryValuation, getLowStockItems,
    getStockMovements, adjustStock, updateLowStockThreshold
} from '@/services/inventoryService';

export default function InventoryDashboardPage() {
    const { adminUser } = useAdminAuth();

    // States cho Màn hình chính
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState(null);
    const [valuation, setValuation] = useState(null);
    const [lowStockCount, setLowStockCount] = useState(0);

    // States cho Filter
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);

    // States cho Side-Drawer (Thẻ Kho)
    const [selectedSku, setSelectedSku] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('movements'); // 'movements' | 'adjust' | 'settings'

    // States Data trong Drawer
    const [movements, setMovements] = useState([]);
    const [loadingDrawer, setLoadingDrawer] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ quantityChange: '', reason: '' });
    const [thresholdForm, setThresholdForm] = useState({ threshold: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Quyền truy cập: Chỉ ADMIN/SUPER_ADMIN mới xem được giá trị kho
    const isAdmin = adminUser?.role?.name === 'ADMIN' || adminUser?.role?.name === 'SUPER_ADMIN';

    // 1. Fetch Dữ liệu Bảng Điều Khiển
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [stockRes, lowStockRes, brandsRes, categoriesRes] = await Promise.all([
                getStockOnHand(),
                getLowStockItems(),
                getBrands(),
                getCategories()
            ]);

            setStockData(stockRes?.result);
            setLowStockCount(lowStockRes?.result?.length || 0);

            setBrands(brandsRes?.result || brandsRes || []);
            setCategories(categoriesRes?.result || categoriesRes || []);

            if (isAdmin) {
                const valRes = await getInventoryValuation();
                setValuation(valRes?.result?.totalValue || 0);
            }
        } catch (error) {
            toast.error("Lỗi tải dữ liệu kho!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [isAdmin]);

    // Format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // Format Ngày giờ
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(dateStr));
    };

    // 2. Xử lý Mở Side-Drawer Thẻ Kho
    const openDrawer = async (item) => {
        setSelectedSku(item);
        setThresholdForm({ threshold: item.lowStockThreshold || 0 });
        setAdjustForm({ quantityChange: '', reason: '' });
        setIsDrawerOpen(true);
        setActiveTab('movements');
        await loadMovements(item.skuId);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => setSelectedSku(null), 300); // Đợi animation trượt xong mới xóa data
    };

    const loadMovements = async (skuId) => {
        setLoadingDrawer(true);
        const res = await getStockMovements(skuId);
        setMovements(res?.result || []);
        setLoadingDrawer(false);
    };

    // 3. Xử lý Cập nhật / Form Submit trong Drawer
    const handleAdjustStock = async (e) => {
        e.preventDefault();
        if (!adjustForm.quantityChange || !adjustForm.reason) {
            toast.warning("Vui lòng nhập đủ số lượng và lý do!");
            return;
        }

        setIsSubmitting(true);
        try {
            await adjustStock({
                skuId: selectedSku.skuId,
                quantityChange: parseInt(adjustForm.quantityChange),
                reason: adjustForm.reason
            });
            toast.success("Điều chỉnh kho thành công!");
            setAdjustForm({ quantityChange: '', reason: '' });

            // Reload lại log biến động và bảng dashboard bên ngoài
            await loadMovements(selectedSku.skuId);
            fetchDashboardData();
        } catch (error) {
            toast.error(error.message || "Lỗi điều chỉnh kho!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateThreshold = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateLowStockThreshold(selectedSku.skuId, { threshold: parseInt(thresholdForm.threshold) });
            toast.success("Cập nhật ngưỡng cảnh báo thành công!");
            fetchDashboardData(); // Reload để cập nhật highlight đỏ ngoài bảng
        } catch (error) {
            toast.error(error.message || "Lỗi cập nhật thiết lập!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = stockData?.items?.filter(item => {
        // Lọc Keyword (Tìm trong Tên SP hoặc Mã SKU)
        const matchKeyword = item.productName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            item.skuCode?.toLowerCase().includes(searchKeyword.toLowerCase());

        // Lọc Brand & Category
        const matchBrand = selectedBrand ? item.brandId === parseInt(selectedBrand) : true;
        const matchCategory = selectedCategory ? item.categoryId === parseInt(selectedCategory) : true;

        return matchKeyword && matchBrand && matchCategory;
    }) || [];

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Package className="text-blue-600" /> Báo Cáo Tồn Kho (Stock Dashboard)
            </h1>

            {/* WIDGETS THỐNG KÊ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-md text-gray-500 mb-1">Tổng Sản Phẩm (SKUs)</p>
                        <p className="text-3xl font-bold text-gray-800">{stockData?.totalSkus || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Package size={24} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-md text-red-600 mb-1 font-medium">Sắp hết hàng</p>
                        <p className="text-3xl font-bold text-red-600">{lowStockCount} <span className="text-lg font-normal">SKUs</span></p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center relative z-10">
                        <AlertTriangle size={24} />
                    </div>
                    {lowStockCount > 0 && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full opacity-50 z-0 animate-pulse"></div>}
                </div>

                {isAdmin && (
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 flex items-center justify-between">
                        <div>
                            <p className="text-md text-emerald-600 mb-1 font-medium">Tổng Giá Trị Kho Tồn</p>
                            <p className="text-2xl font-bold text-emerald-700">{valuation !== null ? formatCurrency(valuation) : '...'}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                    </div>
                )}
            </div>

            {/* MASTER TABLE: DANH SÁCH TỒN KHO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">Chi tiết tồn kho hiện tại</h2>
                    <button onClick={fetchDashboardData} className="text-md text-gray-600 flex items-center gap-1 hover:text-blue-600">
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>
                </div>

                {/* --- THANH FILTER --- */}
                <div className="p-4 border-b bg-white flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text" placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-md"
                            value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-md outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                        value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">-- Tất cả Danh mục --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-md outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                        value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                        <option value="">-- Tất cả Thương hiệu --</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                {/* ------------------------------------ */}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-md border-collapse">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-sm border-b">
                            <tr>
                                <th className="p-4 font-medium">Sản Phẩm</th>
                                <th className="p-4 font-medium">Mã SKU</th>
                                <th className="p-4 font-medium text-center">Tồn Thực Tế (Physical)</th>
                                <th className="p-4 font-medium text-center">Có Thể Bán (Available)</th>
                                <th className="p-4 font-medium text-center text-amber-600">Đang Giữ (Reserved)</th>
                                <th className="p-4 font-medium text-center text-red-600">Lỗi (Defect)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Đang tải dữ liệu kho...</td></tr>
                            ) : stockData?.items?.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => openDrawer(item)}
                                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${item.lowStock ? 'bg-red-50/30' : ''}`}
                                    >
                                        <td className="p-4 font-medium text-gray-800">
                                            {item.productName || 'Sản phẩm chưa có tên'}
                                            {item.lowStock && <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">Sắp hết</span>}
                                        </td>
                                        <td className="p-4 text-gray-500 font-mono text-sm group-hover:text-blue-600">{item.skuCode}</td>
                                        <td className="p-4 text-center text-gray-600">{item.physicalQuantity}</td>
                                        <td className={`p-4 text-center font-bold ${item.lowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {item.availableQuantity}
                                        </td>
                                        <td className="p-4 text-center text-amber-600 font-medium">{item.reservedQuantity > 0 ? item.reservedQuantity : '-'}</td>
                                        <td className="p-4 text-center text-red-600 font-medium">{item.defectQuantity > 0 ? item.defectQuantity : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Chưa có sản phẩm nào trong kho.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ======================================================== */}
            {/* SIDE-DRAWER: CHI TIẾT SKU (THẺ KHO) */}
            {/* ======================================================== */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
                    {/* Backdrop mờ */}
                    <div className="absolute inset-0 bg-black/40 transition-opacity backdrop-blur-sm" onClick={closeDrawer} />

                    {/* Bảng Panel trượt ra */}
                    <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                        {/* Drawer Header */}
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    Thẻ Kho (SKU Details)
                                </h2>
                                <p className="text-md text-gray-500 mt-1">
                                    <span className="font-semibold text-gray-700">{selectedSku?.productName}</span> | Mã: <span className="font-mono">{selectedSku?.skuCode}</span>
                                </p>
                            </div>
                            <button onClick={closeDrawer} className="text-gray-400 hover:text-red-500 bg-gray-200 hover:bg-red-100 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs Menu */}
                        <div className="flex border-b px-6">
                            <button
                                onClick={() => setActiveTab('movements')}
                                className={`px-4 py-3 text-md font-medium border-b-2 flex items-center gap-2 ${activeTab === 'movements' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Activity size={18} /> Lịch sử biến động
                            </button>
                            <button
                                onClick={() => setActiveTab('adjust')}
                                className={`px-4 py-3 text-md font-medium border-b-2 flex items-center gap-2 ${activeTab === 'adjust' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Edit3 size={18} /> Điều chỉnh kho
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className={`px-4 py-3 text-md font-medium border-b-2 flex items-center gap-2 ${activeTab === 'settings' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Settings size={18} /> Cài đặt ngưỡng
                                </button>
                            )}
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white">

                            {/* TAB 1: STOCK MOVEMENTS */}
                            {activeTab === 'movements' && (
                                <div>
                                    {loadingDrawer ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                                    ) : movements.length > 0 ? (
                                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                            {movements.map((mov) => {
                                                const isAdd = mov.afterQuantity > mov.beforeQuantity;

                                                const Icon = isAdd ? ArrowDownRight : ArrowUpRight;
                                                const colorClass = isAdd ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';

                                                return (
                                                    <div key={mov.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${colorClass}`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-xl border shadow-sm">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold text-gray-800 text-md">{mov.movementType}</span>
                                                                <span className={`font-bold text-md ${isAdd ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {isAdd ? '+' : '-'}{mov.quantity}
                                                                </span>
                                                            </div>
                                                            {/* Các thành phần khác giữ nguyên */}
                                                            <p className="text-sm text-gray-500 mb-2">{formatDate(mov.createdAt)}</p>
                                                            <p className="text-md text-gray-700">{mov.note || 'Không có ghi chú'}</p>
                                                            <div className="mt-3 pt-3 border-t text-sm text-gray-500 flex justify-between">
                                                                <span>Trước: {mov.beforeQuantity}</span>
                                                                <span className="font-semibold text-gray-800">Tồn cuối: {mov.afterQuantity}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500 mt-10">Chưa có lịch sử biến động nào cho SKU này.</p>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: STOCK ADJUSTMENT */}
                            {activeTab === 'adjust' && (
                                <div className="max-w-md mx-auto">
                                    <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-md mb-6 border border-amber-200">
                                        Tính năng này dùng để <b>Bù trừ số lượng kho</b> sau khi kiểm kê thực tế. Mọi thao tác đều được lưu lại lịch sử có tên người điều chỉnh.
                                    </div>
                                    <form onSubmit={handleAdjustStock} className="space-y-4">
                                        <div>
                                            <label className="block text-md font-medium text-gray-700 mb-1">Tồn kho Hệ thống hiện tại</label>
                                            <input type="text" disabled value={selectedSku?.physicalQuantity || 0} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-600 font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-md font-medium text-gray-700 mb-1">Số lượng Điều chỉnh (+ / -) <span className="text-red-500">*</span></label>
                                            <input
                                                type="number" required placeholder="VD: Nhập 5 để cộng thêm, -3 để trừ bớt"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                                                value={adjustForm.quantityChange}
                                                onChange={e => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-md font-medium text-gray-700 mb-1">Lý do điều chỉnh <span className="text-red-500">*</span></label>
                                            <textarea
                                                required rows="3" placeholder="VD: Hàng bị ẩm mốc, hoặc kiểm kê dư..."
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                                                value={adjustForm.reason}
                                                onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit" disabled={isSubmitting}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Xác nhận Điều chỉnh'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* TAB 3: SETTINGS (Ngưỡng cảnh báo) */}
                            {activeTab === 'settings' && isAdmin && (
                                <div className="max-w-md mx-auto">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Cảnh báo Tồn kho thấp (Low Stock Alert)</h3>
                                    <p className="text-md text-gray-500 mb-6">Hệ thống sẽ tô đỏ và hiển thị ở Dashboard nếu số lượng bán được (Available) tụt xuống dưới mức này.</p>

                                    <form onSubmit={handleUpdateThreshold} className="space-y-4">
                                        <div>
                                            <label className="block text-md font-medium text-gray-700 mb-1">Mức tồn tối thiểu (Threshold)</label>
                                            <input
                                                type="number" min="0" required
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-800 outline-none font-bold text-lg"
                                                value={thresholdForm.threshold}
                                                onChange={e => setThresholdForm({ threshold: e.target.value })}
                                            />
                                            <p className="text-sm text-gray-500 mt-2">Mẹo: Đặt là 0 để tắt cảnh báo cho mã sản phẩm này.</p>
                                        </div>
                                        <button
                                            type="submit" disabled={isSubmitting}
                                            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center mt-4"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Lưu cài đặt'}
                                        </button>
                                    </form>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}