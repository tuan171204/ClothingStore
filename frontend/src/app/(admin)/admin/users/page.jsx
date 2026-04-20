'use client';

/**
 * admin/users/page.jsx
 *
 * Nhiệm vụ tầng Page (UI):
 *   - Quản lý state (loading, data, modal, filter...)
 *   - Render UI và xử lý sự kiện người dùng
 *   - Gọi service functions từ userManagementService.js
 *   - KHÔNG gọi axios trực tiếp, KHÔNG chứa business logic
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, Search, RefreshCw, MoreVertical, Eye,
    MapPin, ShieldCheck, ChevronLeft, ChevronRight,
    Loader2, X, Phone, Mail, Calendar, Star,
    Home, CheckCircle2, UserX, UserPlus, Edit,
    Trash2, KeyRound,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getCustomers,
    getStaff,
    getUserAddresses,
    updateUserStatus,
    createStaff,
    updateStaff,
    softDeleteStaff,
    assignRole,
} from '@/services/userManagementService';

// ─── Formatters ────────────────────────────────────────────────
const fmt = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const TIER_BADGE = {
    BRONZE: 'bg-amber-100 text-amber-800',
    SILVER: 'bg-gray-200 text-gray-700',
    GOLD: 'bg-yellow-100 text-yellow-800',
};

const PAGE_SIZE = 20;

// ─── Sub-components ────────────────────────────────────────────

/** Avatar tạo từ initials + màu nhất quán */
function UserAvatar({ user, size = 9 }) {
    const initials = (user.fullName || 'U').split(' ').map(w => w[0]).slice(-2).join('');
    const palette = ['from-blue-400 to-blue-600', 'from-violet-400 to-violet-600',
        'from-emerald-400 to-emerald-600', 'from-rose-400 to-rose-600',
        'from-amber-400 to-amber-600', 'from-cyan-400 to-cyan-600'];
    const color = palette[(user.id?.charCodeAt(0) ?? 0) % palette.length];

    return (
        <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-md shrink-0 overflow-hidden`}>
            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
    );
}

/** Status badge */
function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold
            ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
            {active ? 'Hoạt động' : 'Bị khóa'}
        </span>
    );
}

/**
 * ActionMenu — dropdown dùng position:fixed để tránh bị clip bởi overflow:auto của table.
 * Tính tọa độ từ getBoundingClientRect() → render ra ngoài stacking context của table.
 */
function ActionMenu({ user, tab, onView, onViewAddresses, onToggleStatus, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, right: 0 });

    const openMenu = () => {
        const rect = btnRef.current?.getBoundingClientRect();
        if (rect) {
            setPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
        }
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const action = (fn) => { fn(); setOpen(false); };

    const items = [
        { icon: Eye, label: 'Xem chi tiết', color: 'text-indigo-600', onClick: () => action(() => onView(user)) },
        { icon: MapPin, label: 'Sổ địa chỉ', color: 'text-blue-600', onClick: () => action(() => onViewAddresses(user)) },
        ...(tab === 'staff' ? [
            { icon: Edit, label: 'Chỉnh sửa', color: 'text-amber-600', onClick: () => action(() => onEdit(user)), divider: false },
            { icon: Trash2, label: 'Xóa nhân viên', color: 'text-red-500', onClick: () => action(() => onDelete(user)), divider: false },
        ] : []),
        {
            icon: user.active ? UserX : ShieldCheck,
            label: user.active ? 'Khóa tài khoản' : 'Mở khóa',
            color: user.active ? 'text-red-600' : 'text-green-600',
            onClick: () => action(() => onToggleStatus(user)),
            divider: true,
        },
    ];

    return (
        <>
            <button ref={btnRef} onClick={openMenu}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors">
                <MoreVertical size={16} />
            </button>

            {open && (
                <div ref={menuRef}
                    style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
                    className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden">
                    {items.map((item) => (
                        <React.Fragment key={item.label}>
                            {item.divider && <div className="my-1 border-t border-gray-100" />}
                            <button onClick={item.onClick}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-md font-medium
                                    hover:bg-gray-50 transition-colors cursor-pointer text-left ${item.color}`}>
                                <item.icon size={14} /> {item.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </>
    );
}

/** Modal hiển thị sổ địa chỉ của user */
function AddressModal({ user, onClose }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserAddresses(user.id)
            .then(setAddresses)
            .catch(() => toast.error('Không thể tải địa chỉ'))
            .finally(() => setLoading(false));
    }, [user.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" /> Sổ địa chỉ
                        </h3>
                        <p className="text-md text-gray-500 mt-0.5">{user.fullName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
                        <X size={17} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 size={24} className="animate-spin text-blue-400" />
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <Home size={36} className="mx-auto mb-3 opacity-20" />
                            <p className="text-md font-medium">Chưa có địa chỉ nào</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {addresses.map((addr) => (
                                <div key={addr.id}
                                    className={`p-4 rounded-xl border ${addr.isDefault
                                        ? 'border-blue-200 bg-blue-50/50'
                                        : 'border-gray-100 bg-gray-50'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 text-md">{addr.receiverName}</p>
                                            {addr.isDefault && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Mặc định
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-400 font-mono">#{addr.id}</span>
                                    </div>
                                    <div className="space-y-1 text-md text-gray-600">
                                        <p className="flex items-center gap-2">
                                            <Phone size={13} className="text-gray-400 shrink-0" />
                                            {addr.phone}
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                            <span>
                                                {[addr.streetAddress, addr.wardName, addr.districtName, addr.provinceName]
                                                    .filter(Boolean).join(', ')}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Modal xem chi tiết user */
function UserDetailModal({ user, onClose, onToggleStatus }) {
    const tierStyle = TIER_BADGE[user.membershipTier] || TIER_BADGE.BRONZE;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Eye size={16} className="text-indigo-500" /> Chi tiết người dùng
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
                        <X size={17} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <UserAvatar user={user} size={14} />
                        <div>
                            <p className="font-bold text-gray-900 text-base">{user.fullName}</p>
                            <p className="text-md text-gray-500">@{user.username}</p>
                            <StatusBadge active={user.active} />
                        </div>
                    </div>

                    <div className="space-y-3 text-md">
                        {[
                            { icon: Mail, label: 'Email', value: user.email },
                            { icon: Phone, label: 'SĐT', value: user.phoneNumber || '—' },
                            { icon: Calendar, label: 'Ngày sinh', value: fmtDate(user.dob) },
                            { icon: Calendar, label: 'Tham gia', value: fmtDate(user.createdAt) },
                            { icon: KeyRound, label: 'Đăng nhập', value: user.provider || 'LOCAL' },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                                <Icon size={14} className="text-gray-400 shrink-0" />
                                <span className="text-gray-500 w-20 shrink-0">{label}</span>
                                <span className="font-medium text-gray-800 truncate">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Customer info block */}
                    {(user.membershipTier || user.totalOrders != null) && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                            <p className="text-sm font-black text-gray-400 uppercase tracking-wide">Thông tin khách hàng</p>
                            {user.membershipTier && (
                                <div className="flex items-center justify-between">
                                    <span className="text-md text-gray-600">Hạng thành viên</span>
                                    <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${tierStyle}`}>
                                        <Star size={10} className="inline mr-1" />{user.membershipTier}
                                    </span>
                                </div>
                            )}
                            {user.totalOrders != null && (
                                <div className="flex items-center justify-between">
                                    <span className="text-md text-gray-600">Số đơn hàng</span>
                                    <span className="font-bold text-gray-800">{user.totalOrders} đơn</span>
                                </div>
                            )}
                            {user.totalSpent != null && (
                                <div className="flex items-center justify-between">
                                    <span className="text-md text-gray-600">Tổng chi tiêu</span>
                                    <span className="font-bold text-gray-800">{fmt(user.totalSpent)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={() => onToggleStatus(user)}
                        className={`w-full py-2.5 rounded-xl font-bold text-md flex items-center justify-center gap-2 cursor-pointer transition-colors border
                            ${user.active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'}`}>
                        {user.active ? <><UserX size={15} /> Khóa tài khoản</> : <><ShieldCheck size={15} /> Mở khóa</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Modal tạo / sửa nhân viên */
function StaffFormModal({ staff, onClose, onSaved }) {
    const isEdit = !!staff;
    const [form, setForm] = useState({
        fullName: staff?.fullName || '',
        username: staff?.username || '',
        email: staff?.email || '',
        phoneNumber: staff?.phoneNumber || '',
        password: '',
        role: staff?.role || 'STAFF',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.fullName || !form.email) {
            toast.error('Vui lòng nhập đầy đủ họ tên và email');
            return;
        }
        setSaving(true);
        try {
            if (isEdit) {
                await updateStaff(staff.id, {
                    fullName: form.fullName,
                    email: form.email,
                    phoneNumber: form.phoneNumber,
                    role: form.role,
                });
                toast.success('Cập nhật nhân viên thành công!');
            } else {
                if (!form.username || !form.password) {
                    toast.error('Vui lòng nhập username và mật khẩu');
                    setSaving(false);
                    return;
                }
                await createStaff(form);
                toast.success('Tạo tài khoản nhân viên thành công!');
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const Field = ({ label, name, type = 'text', required }) => (
        <div>
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input type={type} value={form[name]}
                onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-md focus:ring-2 focus:ring-blue-400 outline-none"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus size={16} className="text-blue-500" />
                        {isEdit ? 'Cập nhật nhân viên' : 'Tạo nhân viên mới'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full cursor-pointer">
                        <X size={17} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <Field label="Họ tên" name="fullName" required />
                    <Field label="Email" name="email" type="email" required />
                    <Field label="Số điện thoại" name="phoneNumber" />
                    {!isEdit && (
                        <>
                            <Field label="Username" name="username" required />
                            <Field label="Mật khẩu" name="password" type="password" required />
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
                            Role
                        </label>
                        <select value={form.role}
                            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-md focus:ring-2 focus:ring-blue-400 outline-none bg-white">
                            <option value="STAFF">Staff</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </div>

                <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2.5 text-md bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold cursor-pointer">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-5 py-2.5 text-md bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                        {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function UsersPage() {
    const [tab, setTab] = useState('customer');
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(0);
    const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    // Modal states
    const [viewUser, setViewUser] = useState(null);
    const [addressUser, setAddressUser] = useState(null);
    const [staffForm, setStaffForm] = useState(null); // null | 'new' | userObject

    const debounceRef = useRef(null);

    // ── Data loading ──────────────────────────────────────────
    const load = useCallback(async (pg = 0) => {
        setLoading(true);
        try {
            const params = { keyword, page: pg, size: PAGE_SIZE };
            if (statusFilter !== '') params.active = statusFilter === 'active';

            const res = tab === 'customer'
                ? await getCustomers(params)
                : await getStaff(params);

            // Normalize: unwrap ApiResponse wrapper nếu có
            const raw = res?.result ?? res;
            setData({
                content: raw?.content ?? (Array.isArray(raw) ? raw : []),
                totalElements: raw?.totalElements ?? 0,
                totalPages: raw?.totalPages ?? 1,
            });
        } catch {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [tab, keyword, statusFilter]);

    // Debounce keyword changes
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setPage(0); load(0); }, 350);
        return () => clearTimeout(debounceRef.current);
    }, [keyword, tab, statusFilter]);

    useEffect(() => { load(page); }, [page]);

    // ── Handlers ──────────────────────────────────────────────
    const handleToggleStatus = async (user) => {
        const action = user.active ? 'khóa' : 'mở khóa';
        if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản "${user.fullName}"?`)) return;
        try {
            await updateUserStatus(user.id, !user.active);
            toast.success(`Đã ${action} tài khoản thành công!`);
            load(page);
            // Cập nhật modal nếu đang mở
            if (viewUser?.id === user.id) setViewUser(prev => ({ ...prev, active: !prev.active }));
        } catch {
            toast.error(`Không thể ${action} tài khoản`);
        }
    };

    const handleDeleteStaff = async (user) => {
        if (!window.confirm(`Xóa nhân viên "${user.fullName}"? Tài khoản sẽ bị vô hiệu hóa.`)) return;
        try {
            await softDeleteStaff(user.id);
            toast.success('Đã xóa nhân viên!');
            load(page);
        } catch {
            toast.error('Không thể xóa nhân viên');
        }
    };

    // ── Render helpers ────────────────────────────────────────
    const renderRow = (user) => (
        <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate max-w-[160px] text-md">{user.fullName}</p>
                        <p className="text-sm text-gray-400 font-mono">@{user.username}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-md text-gray-600 max-w-[200px]">
                <span className="truncate block">{user.email}</span>
                {user.phoneNumber && <span className="text-sm text-gray-400">{user.phoneNumber}</span>}
            </td>
            <td className="px-4 py-3 text-center">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-bold">
                    {user.role || 'USER'}
                </span>
            </td>
            <td className="px-4 py-3 text-center">
                <StatusBadge active={user.active} />
            </td>
            <td className="px-4 py-3 text-right">
                {user.totalSpent != null ? (
                    <>
                        <p className="font-bold text-gray-800 text-md">{fmt(user.totalSpent)}</p>
                        {user.totalOrders != null && (
                            <p className="text-sm text-gray-400">{user.totalOrders} đơn</p>
                        )}
                    </>
                ) : <span className="text-gray-300 text-sm">—</span>}
            </td>
            <td className="px-4 py-3 text-center">
                <ActionMenu
                    user={user}
                    tab={tab}
                    onView={setViewUser}
                    onViewAddresses={setAddressUser}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(u) => setStaffForm(u)}
                    onDelete={handleDeleteStaff}
                />
            </td>
        </tr>
    );

    const renderCard = (user) => (
        <div key={user.id} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0">
            <UserAvatar user={user} />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-md truncate">{user.fullName}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                    <StatusBadge active={user.active} />
                    {user.totalSpent != null && (
                        <span className="text-sm text-gray-500">{fmt(user.totalSpent)}</span>
                    )}
                </div>
            </div>
            <ActionMenu
                user={user}
                tab={tab}
                onView={setViewUser}
                onViewAddresses={setAddressUser}
                onToggleStatus={handleToggleStatus}
                onEdit={(u) => setStaffForm(u)}
                onDelete={handleDeleteStaff}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users size={22} className="text-blue-600" /> Quản lý người dùng
                    </h1>
                    <p className="text-md text-gray-500 mt-0.5">Khách hàng &amp; Nhân viên · {data.totalElements} tài khoản</p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                    {tab === 'staff' && (
                        <button onClick={() => setStaffForm('new')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-md font-bold hover:bg-blue-700 cursor-pointer">
                            <UserPlus size={15} /> Tạo nhân viên
                        </button>
                    )}
                    <button onClick={() => load(page)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-md font-medium hover:bg-gray-50 cursor-pointer">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {[
                    { key: 'customer', label: 'Khách hàng', icon: Users },
                    { key: 'staff', label: 'Nhân viên', icon: ShieldCheck },
                ].map(t => (
                    <button key={t.key} onClick={() => { setTab(t.key); setPage(0); setKeyword(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-md font-bold cursor-pointer border transition-all
                            ${tab === t.key
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                        <t.icon size={15} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Tìm tên, email, SĐT..."
                        value={keyword} onChange={e => setKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-md focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-md outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[160px]">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Bị khóa</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Mobile */}
                <div className="block sm:hidden">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 size={24} className="animate-spin text-blue-400" />
                        </div>
                    ) : data.content.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <Users size={36} className="mx-auto mb-2 opacity-20" />
                            <p className="text-md">Không tìm thấy người dùng</p>
                        </div>
                    ) : data.content.map(renderCard)}
                </div>

                {/* Desktop — overflow-visible để dropdown không bị cắt */}
                <div className="hidden sm:block" style={{ overflowX: 'auto' }}>
                    <table className="w-full text-md text-left">
                        <thead className="bg-gray-50 border-b text-sm font-bold text-gray-500 uppercase tracking-wide">
                            <tr>
                                <th className="px-4 py-3">Người dùng</th>
                                <th className="px-4 py-3">Liên hệ</th>
                                <th className="px-4 py-3 text-center">Role</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-right">Chi tiêu</th>
                                <th className="px-4 py-3 text-center w-14" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-16 text-center">
                                    <Loader2 size={26} className="animate-spin text-blue-400 mx-auto mb-2" />
                                    <p className="text-md text-gray-400">Đang tải...</p>
                                </td></tr>
                            ) : data.content.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center text-gray-400">
                                    <Users size={36} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-md">Không tìm thấy người dùng nào</p>
                                </td></tr>
                            ) : data.content.map(renderRow)}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 flex-wrap gap-2">
                        <span className="text-sm text-gray-500">
                            {data.totalElements} người dùng · Trang {page + 1}/{data.totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 cursor-pointer">
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                                const p = Math.min(Math.max(page - 2 + i, 0), data.totalPages - 1);
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-md font-medium cursor-pointer transition-colors
                                            ${page === p ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-100 text-gray-600'}`}>
                                        {p + 1}
                                    </button>
                                );
                            })}
                            <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1}
                                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-100 cursor-pointer">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {viewUser && (
                <UserDetailModal
                    user={viewUser}
                    onClose={() => setViewUser(null)}
                    onToggleStatus={handleToggleStatus}
                />
            )}
            {addressUser && (
                <AddressModal user={addressUser} onClose={() => setAddressUser(null)} />
            )}
            {staffForm && (
                <StaffFormModal
                    staff={staffForm === 'new' ? null : staffForm}
                    onClose={() => setStaffForm(null)}
                    onSaved={() => load(page)}
                />
            )}
        </div>
    );
}