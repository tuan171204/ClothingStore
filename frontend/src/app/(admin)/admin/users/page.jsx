'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, UserCheck, Search, Filter, ChevronDown,
    MoreHorizontal, Eye, Ban, CheckCircle, RefreshCw,
    Plus, Pencil, Trash2, ShieldCheck, X,
} from 'lucide-react';
import {
    getCustomers, getStaff, createStaff,
    updateStaff, softDeleteStaff,
    updateUserStatus, assignRole,
} from '@/services/userManagementService';
import Pagination from '@/components/admin/Pagination';
import { toast } from 'react-toastify';

// ── Helpers ─────────────────────────────────────────────────
const ROLE_BADGE = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    ADMIN: 'bg-violet-100 text-violet-700',
    STAFF: 'bg-blue-100 text-blue-700',
    USER: 'bg-gray-100 text-gray-600',
};

const fmt = (n) =>
    n ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';

// ── Status badge ────────────────────────────────────────────
function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold
            ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`} />
            {active ? 'Hoạt động' : 'Bị khóa'}
        </span>
    );
}

// ── Staff Form Modal ─────────────────────────────────────────
function StaffModal({ open, onClose, onSaved, editing = null }) {
    const [form, setForm] = useState({
        username: '', password: '', fullName: '', email: '',
        phoneNumber: '', role: 'STAFF',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editing) {
            setForm({
                username: editing.username ?? '',
                password: '',
                fullName: editing.fullName ?? '',
                email: editing.email ?? '',
                phoneNumber: editing.phoneNumber ?? '',
                role: editing.role ?? 'STAFF',
            });
        } else {
            setForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '', role: 'STAFF' });
        }
    }, [editing, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                const { username, password, ...rest } = form;
                await updateStaff(editing.id, rest);
                toast.success('Cập nhật nhân viên thành công!');
            } else {
                await createStaff(form);
                toast.success('Tạo tài khoản nhân viên thành công!');
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="font-bold text-gray-900">
                        {editing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {!editing && (
                        <>
                            <Field label="Username *" value={form.username}
                                onChange={v => setForm(p => ({ ...p, username: v }))} required />
                            <Field label="Mật khẩu *" type="password" value={form.password}
                                onChange={v => setForm(p => ({ ...p, password: v }))} required />
                        </>
                    )}
                    <Field label="Họ tên *" value={form.fullName}
                        onChange={v => setForm(p => ({ ...p, fullName: v }))} required />
                    <Field label="Email *" type="email" value={form.email}
                        onChange={v => setForm(p => ({ ...p, email: v }))} required />
                    <Field label="Số điện thoại" value={form.phoneNumber}
                        onChange={v => setForm(p => ({ ...p, phoneNumber: v }))} />
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Role *</label>
                        <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-md focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-md font-semibold hover:bg-gray-50">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-md font-semibold hover:bg-blue-700 disabled:opacity-60">
                            {saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo tài khoản')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, type = 'text', value, onChange, required }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                required={required}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-md focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
    );
}

// ── User Row Actions Menu ────────────────────────────────────
function ActionMenu({ user, onRefresh, onEdit }) {
    const [open, setOpen] = useState(false);

    const toggle = async (active) => {
        try {
            await updateUserStatus(user.id, active);
            toast.success(active ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
            onRefresh();
        } catch { toast.error('Có lỗi xảy ra'); }
        setOpen(false);
    };

    const del = async () => {
        if (!confirm(`Xác nhận xóa tài khoản ${user.fullName}?`)) return;
        try {
            await softDeleteStaff(user.id);
            toast.success('Đã xóa tài khoản');
            onRefresh();
        } catch { toast.error('Có lỗi xảy ra'); }
        setOpen(false);
    };

    return (
        <div className="relative">
            <button onClick={() => setOpen(p => !p)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal size={16} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg w-44 py-1 overflow-hidden">
                        {onEdit && (
                            <button onClick={() => { onEdit(user); setOpen(false); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-md hover:bg-gray-50">
                                <Pencil size={13} className="text-blue-500" /> Chỉnh sửa
                            </button>
                        )}
                        {user.active ? (
                            <button onClick={() => toggle(false)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-md hover:bg-gray-50 text-red-600">
                                <Ban size={13} /> Khóa tài khoản
                            </button>
                        ) : (
                            <button onClick={() => toggle(true)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-md hover:bg-gray-50 text-emerald-600">
                                <CheckCircle size={13} /> Kích hoạt
                            </button>
                        )}
                        {(user.role === 'STAFF' || user.role === 'ADMIN') && (
                            <button onClick={del}
                                className="flex items-center gap-2 w-full px-3 py-2 text-md hover:bg-red-50 text-red-600">
                                <Trash2 size={13} /> Xóa tài khoản
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────
export default function UsersManagementPage() {
    const [tab, setTab] = useState('customers');
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const SIZE = 15;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { keyword, page, size: SIZE };
            if (activeFilter !== '') params.active = activeFilter;
            const res = tab === 'customers'
                ? await getCustomers(params)
                : await getStaff(params);
            setData(res ?? { content: [], totalElements: 0, totalPages: 0 });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [tab, keyword, page, activeFilter]);

    useEffect(() => { load(); }, [load]);

    const handleTabChange = (t) => { setTab(t); setPage(0); setKeyword(''); setActiveFilter(''); };

    const users = data.content ?? [];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Quản lý người dùng</h1>
                    <p className="text-md text-gray-500 mt-0.5">Khách hàng & Nhân viên</p>
                </div>
                {tab === 'staff' && (
                    <button onClick={() => { setEditing(null); setModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-md font-semibold hover:bg-blue-700 transition-colors">
                        <Plus size={16} /> Thêm nhân viên
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { key: 'customers', label: 'Khách hàng', icon: Users },
                    { key: 'staff', label: 'Nhân viên', icon: ShieldCheck },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => handleTabChange(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-md font-semibold transition-all
                            ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-52">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }}
                        placeholder="Tìm tên, email, SĐT..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-md focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                </div>
                <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(0); }}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-md font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Hoạt động</option>
                    <option value="false">Bị khóa</option>
                </select>
                <button onClick={load}
                    className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white">
                    <RefreshCw size={15} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-md">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Người dùng</th>
                                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Role</th>
                                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                                {tab === 'customers' && (
                                    <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Chi tiêu</th>
                                )}
                                <th className="text-right px-4 py-3 text-sm font-bold text-gray-500 uppercase tracking-wide">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                                    <RefreshCw size={20} className="animate-spin mx-auto" />
                                </td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-md">
                                    Không tìm thấy người dùng nào
                                </td></tr>
                            ) : users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500
                                                flex items-center justify-center text-white text-md font-bold shrink-0 overflow-hidden">
                                                {u.avatar
                                                    ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                                    : (u.fullName ?? 'U').charAt(0).toUpperCase()
                                                }
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-md">{u.fullName ?? u.username}</p>
                                                <p className="text-sm text-gray-400 sm:hidden">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-md hidden sm:table-cell">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge active={u.active} /></td>
                                    {tab === 'customers' && (
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <div>
                                                <p className="text-md font-semibold text-gray-700">{fmt(u.totalSpent)}</p>
                                                <p className="text-sm text-gray-400">{u.totalOrders ?? 0} đơn</p>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-right">
                                        <ActionMenu user={u} onRefresh={load}
                                            onEdit={tab === 'staff' ? (u) => { setEditing(u); setModalOpen(true); } : null} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={page} totalPages={data.totalPages ?? 0}
                    totalElements={data.totalElements ?? 0} size={SIZE}
                    onPageChange={setPage} loading={loading} />
            </div>

            <StaffModal open={modalOpen} onClose={() => setModalOpen(false)}
                onSaved={load} editing={editing} />
        </div>
    );
}