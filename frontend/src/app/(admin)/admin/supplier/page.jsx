'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Building2, Plus, Edit, Trash2, Search, X, RefreshCw,
    Phone, Mail, MapPin, FileText, ChevronDown, ChevronUp,
    CheckCircle, XCircle, Eye, ShieldOff, Users
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getSuppliers, createSupplier, updateSupplier, deleteSupplier
} from '@/services/supplierService';
import Pagination from '@/components/admin/Pagination';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    isActive: true,
};

export default function SuppliersPage() {
    // ── State ──────────────────────────────────────────────
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const [keyword, setKeyword] = useState('');
    const [queryKeyword, setQueryKeyword] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    const debounceRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const [detailSupplier, setDetailSupplier] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // ── Fetch ──────────────────────────────────────────────
    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSuppliers({ keyword: queryKeyword, activeOnly, page, size: PAGE_SIZE });
            const result = res?.result;
            if (result?.content !== undefined) {
                setData(result);
            } else if (Array.isArray(result)) {
                setData({ content: result, totalElements: result.length, totalPages: 1 });
            }
        } catch {
            toast.error('Không tải được danh sách nhà cung cấp!');
        } finally {
            setLoading(false);
        }
    }, [queryKeyword, activeOnly, page]);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    // Debounce search
    const handleKeywordChange = (val) => {
        setKeyword(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setQueryKeyword(val);
            setPage(0);
        }, 350);
    };

    // ── Form Validation ────────────────────────────────────
    const validate = (f) => {
        const errs = {};
        if (!f.name?.trim()) errs.name = 'Tên nhà cung cấp không được để trống';
        if (f.phone && !/^(\+84|0)[0-9]{9,10}$/.test(f.phone))
            errs.phone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
        if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
            errs.email = 'Email không hợp lệ';
        if (f.taxCode && !/^[0-9]{10,13}$/.test(f.taxCode))
            errs.taxCode = 'Mã số thuế phải là 10–13 chữ số';
        return errs;
    };

    // ── Modal ──────────────────────────────────────────────
    const openCreate = () => {
        setEditingSupplier(null);
        setForm(EMPTY_FORM);
        setFormErrors({});
        setIsModalOpen(true);
    };

    const openEdit = (supplier) => {
        setEditingSupplier(supplier);
        setForm({
            name: supplier.name || '',
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            taxCode: supplier.taxCode || '',
            isActive: supplier.isActive !== false,
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

        setSaving(true);
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, form);
                toast.success('Cập nhật nhà cung cấp thành công!');
            } else {
                await createSupplier(form);
                toast.success('Thêm nhà cung cấp thành công!');
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (supplier) => {
        if (!window.confirm(`Ẩn nhà cung cấp "${supplier.name}"?\nPhiếu nhập đã tạo sẽ được bảo toàn.`)) return;
        try {
            await deleteSupplier(supplier.id);
            toast.success('Đã ẩn nhà cung cấp!');
            fetchSuppliers();
        } catch {
            toast.error('Lỗi khi ẩn nhà cung cấp!');
        }
    };

    const openDetail = (supplier) => {
        setDetailSupplier(supplier);
        setIsDetailOpen(true);
    };

    const setField = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: '' }));
    };

    // ── Render ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 size={22} className="text-emerald-600" />
                        Quản lý Nhà cung cấp
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Đối tác kinh doanh &amp; xưởng may — phân biệt với Brand hiển thị cho khách hàng
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm text-sm w-full sm:w-auto">
                    <Plus size={16} /> Thêm nhà cung cấp
                </button>
            </div>

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <StatCard label="Tổng NCC" value={data.totalElements} color="emerald" icon={<Building2 size={16} />} />
                <StatCard label="Đang hoạt động" value={data.content.filter(s => s.isActive).length} color="green" icon={<CheckCircle size={16} />} />
                <StatCard label="Đã ẩn" value={data.content.filter(s => !s.isActive).length} color="gray" icon={<ShieldOff size={16} />} />
            </div>

            {/* ── TOOLBAR ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={keyword}
                        onChange={e => handleKeywordChange(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    {keyword && (
                        <button onClick={() => handleKeywordChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                    <div
                        onClick={() => { setActiveOnly(p => !p); setPage(0); }}
                        className={`relative w-10 h-5 rounded-full transition-colors ${activeOnly ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">Chỉ đang hoạt động</span>
                </label>

                <button onClick={fetchSuppliers}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 bg-white text-gray-600 font-medium">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Làm mới
                </button>
            </div>

            {/* ── TABLE / CARDS ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <RefreshCw size={28} className="animate-spin text-emerald-400" />
                    </div>
                ) : data.content.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm">{keyword ? `Không tìm thấy nhà cung cấp "${keyword}"` : 'Chưa có nhà cung cấp nào'}</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: cards */}
                        <div className="block sm:hidden divide-y divide-gray-100">
                            {data.content.map(s => (
                                <div key={s.id} className="p-3 hover:bg-gray-50">
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-800 text-sm">{s.name}</span>
                                                <StatusBadge active={s.isActive} />
                                            </div>
                                            {s.contactPerson && <p className="text-xs text-gray-500 mt-0.5">{s.contactPerson}</p>}
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            <ActionBtn icon={<Eye size={13} />} color="blue" onClick={() => openDetail(s)} title="Xem" />
                                            <ActionBtn icon={<Edit size={13} />} color="amber" onClick={() => openEdit(s)} title="Sửa" />
                                            {s.isActive && <ActionBtn icon={<Trash2 size={13} />} color="red" onClick={() => handleDelete(s)} title="Ẩn" />}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        {s.phone && <span className="flex items-center gap-1"><Phone size={10} />{s.phone}</span>}
                                        {s.email && <span className="flex items-center gap-1 truncate max-w-[200px]"><Mail size={10} />{s.email}</span>}
                                    </div>
                                    {s.totalGrnCount != null && (
                                        <p className="text-xs text-emerald-600 font-medium mt-1">{s.totalGrnCount} phiếu nhập</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-5 py-3 w-12">ID</th>
                                        <th className="px-5 py-3 min-w-[180px]">Tên NCC</th>
                                        <th className="px-5 py-3">Người liên hệ</th>
                                        <th className="px-5 py-3">Liên hệ</th>
                                        <th className="px-5 py-3">Mã số thuế</th>
                                        <th className="px-5 py-3 text-center">Phiếu nhập</th>
                                        <th className="px-5 py-3 text-center">Trạng thái</th>
                                        <th className="px-5 py-3 text-center w-32">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.content.map(s => (
                                        <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors">
                                            <td className="px-5 py-4 text-gray-400 font-mono">#{s.id}</td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-800">{s.name}</p>
                                                {s.address && <p className="text-xs text-gray-400 truncate max-w-[200px]" title={s.address}>{s.address}</p>}
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">{s.contactPerson || '—'}</td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-0.5">
                                                    {s.phone && <p className="text-xs flex items-center gap-1 text-gray-600"><Phone size={10} className="text-gray-400" />{s.phone}</p>}
                                                    {s.email && <p className="text-xs flex items-center gap-1 text-gray-600"><Mail size={10} className="text-gray-400" />{s.email}</p>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs text-gray-500">{s.taxCode || '—'}</td>
                                            <td className="px-5 py-4 text-center">
                                                {s.totalGrnCount != null ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                        <FileText size={10} />{s.totalGrnCount}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <StatusBadge active={s.isActive} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ActionBtn icon={<Eye size={14} />} color="blue" onClick={() => openDetail(s)} title="Chi tiết" />
                                                    <ActionBtn icon={<Edit size={14} />} color="amber" onClick={() => openEdit(s)} title="Sửa" />
                                                    {s.isActive && <ActionBtn icon={<Trash2 size={14} />} color="red" onClick={() => handleDelete(s)} title="Ẩn" />}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            page={page}
                            totalPages={data.totalPages}
                            totalElements={data.totalElements}
                            size={PAGE_SIZE}
                            onPageChange={setPage}
                            loading={loading}
                        />
                    </>
                )}
            </div>

            {/* ── DETAIL MODAL ── */}
            {isDetailOpen && detailSupplier && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b bg-emerald-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <Building2 size={20} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800">{detailSupplier.name}</h2>
                                    <p className="text-xs text-gray-500">ID #{detailSupplier.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)}
                                className="p-1.5 hover:bg-white/60 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <DetailRow icon={<Users size={14} />} label="Người liên hệ" value={detailSupplier.contactPerson} />
                            <DetailRow icon={<Phone size={14} />} label="Điện thoại" value={detailSupplier.phone} />
                            <DetailRow icon={<Mail size={14} />} label="Email" value={detailSupplier.email} />
                            <DetailRow icon={<MapPin size={14} />} label="Địa chỉ" value={detailSupplier.address} />
                            <DetailRow icon={<FileText size={14} />} label="Mã số thuế" value={detailSupplier.taxCode} />
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm text-gray-500">Tổng phiếu nhập</span>
                                <span className="font-bold text-emerald-600 text-lg">{detailSupplier.totalGrnCount ?? 0}</span>
                            </div>
                        </div>
                        <div className="px-5 pb-5 flex gap-3">
                            <button onClick={() => setIsDetailOpen(false)}
                                className="flex-1 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors">
                                Đóng
                            </button>
                            <button onClick={() => { setIsDetailOpen(false); openEdit(detailSupplier); }}
                                className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white transition-colors">
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CREATE / EDIT MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingSupplier ? '✏️ Cập nhật nhà cung cấp' : '➕ Thêm nhà cung cấp mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Tên */}
                            <FormField
                                label="Tên nhà cung cấp"
                                required
                                error={formErrors.name}
                            >
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setField('name', e.target.value)}
                                    placeholder="VD: Xưởng May Thành Công"
                                    className={inputCls(formErrors.name)}
                                />
                            </FormField>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Người liên hệ */}
                                <FormField label="Người liên hệ">
                                    <input
                                        type="text"
                                        value={form.contactPerson}
                                        onChange={e => setField('contactPerson', e.target.value)}
                                        placeholder="VD: Nguyễn Văn A"
                                        className={inputCls()}
                                    />
                                </FormField>

                                {/* SĐT */}
                                <FormField label="Số điện thoại" error={formErrors.phone}>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setField('phone', e.target.value)}
                                        placeholder="VD: 0901234567"
                                        className={inputCls(formErrors.phone)}
                                    />
                                </FormField>

                                {/* Email */}
                                <FormField label="Email" error={formErrors.email}>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setField('email', e.target.value)}
                                        placeholder="VD: contact@supplier.vn"
                                        className={inputCls(formErrors.email)}
                                    />
                                </FormField>

                                {/* MST */}
                                <FormField label="Mã số thuế" error={formErrors.taxCode}>
                                    <input
                                        type="text"
                                        value={form.taxCode}
                                        onChange={e => setField('taxCode', e.target.value)}
                                        placeholder="10–13 chữ số"
                                        className={inputCls(formErrors.taxCode)}
                                    />
                                </FormField>
                            </div>

                            {/* Địa chỉ */}
                            <FormField label="Địa chỉ">
                                <textarea
                                    rows={2}
                                    value={form.address}
                                    onChange={e => setField('address', e.target.value)}
                                    placeholder="Số nhà, đường, quận, tỉnh/thành phố..."
                                    className={inputCls() + ' resize-none'}
                                />
                            </FormField>

                            {/* Trạng thái (chỉ hiện khi edit) */}
                            {editingSupplier && (
                                <FormField label="Trạng thái">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div
                                            onClick={() => setField('isActive', !form.isActive)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </div>
                                        <span className={`text-sm font-medium ${form.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                                            {form.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                                        </span>
                                    </label>
                                </FormField>
                            )}

                            <div className="flex justify-end gap-3 pt-2 pb-1">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl font-semibold transition-colors shadow-sm">
                                    {saving ? 'Đang lưu...' : (editingSupplier ? 'Lưu thay đổi' : 'Thêm mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────

const StatCard = ({ label, value, color, icon }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        green: 'bg-green-50 text-green-700 border-green-100',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return (
        <div className={`${colors[color]} border rounded-xl p-3 sm:p-4 flex items-center gap-3`}>
            <div className="opacity-70">{icon}</div>
            <div>
                <p className="text-xs font-medium opacity-70 leading-tight">{label}</p>
                <p className="font-bold text-lg leading-none mt-0.5">{value}</p>
            </div>
        </div>
    );
};

const StatusBadge = ({ active }) =>
    active ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle size={10} /> Hoạt động
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
            <XCircle size={10} /> Đã ẩn
        </span>
    );

const ActionBtn = ({ icon, color, onClick, title }) => {
    const colors = {
        blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
        amber: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
        red: 'bg-red-50 hover:bg-red-100 text-red-600',
    };
    return (
        <button onClick={onClick} title={title}
            className={`${colors[color]} p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer`}>
            {icon}
        </button>
    );
};

const DetailRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm text-gray-700 font-medium">{value || <span className="text-gray-300 italic">Chưa cập nhật</span>}</p>
        </div>
    </div>
);

const FormField = ({ label, required, error, children }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const inputCls = (err) =>
    `w-full border ${err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-emerald-400'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors`;