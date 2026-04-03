'use client';

import React, { useState } from 'react';
import { Send, Truck, RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '@/lib/axios';

/**
 * Danh sách trạng thái GHN đầy đủ (khớp với tài liệu chính thức và GhnStatus.java).
 * Bao gồm cả các trạng thái trung gian để test webhook toàn diện.
 */
const STATUS_OPTIONS = [
    // --- Luồng tiến (không đổi OrderStatus) ---
    { value: 'ready_to_pick', label: 'Chờ lấy hàng', group: 'Đang vận chuyển' },
    { value: 'picking', label: 'Đang lấy hàng', group: 'Đang vận chuyển' },
    { value: 'picked', label: 'Đã lấy hàng', group: 'Đang vận chuyển' },
    { value: 'storing', label: 'Đang lưu kho trung chuyển', group: 'Đang vận chuyển' },
    { value: 'transporting', label: 'Vận chuyển liên tỉnh', group: 'Đang vận chuyển' },
    { value: 'sorting', label: 'Đang phân loại tại bưu cục', group: 'Đang vận chuyển' },
    { value: 'in_transit', label: 'Đang đến bưu cục gần bạn', group: 'Đang vận chuyển' },
    { value: 'on_hold', label: 'Tạm giữ - liên hệ khách', group: 'Đang vận chuyển' },
    { value: 'delivering', label: 'Đang giao tới khách', group: 'Đang vận chuyển' },
    { value: 'delivery_fail', label: 'Giao thất bại, sẽ thử lại', group: 'Đang vận chuyển' },
    // --- Trạng thái cuối (có đổi OrderStatus) ---
    { value: 'delivered', label: 'Giao thành công → COMPLETED', group: 'Kết thúc' },
    { value: 'cancel', label: 'Hủy đơn → CANCELLED', group: 'Kết thúc' },
    { value: 'return', label: 'Bắt đầu hoàn hàng → CANCELLED', group: 'Kết thúc' },
    { value: 'return_transit', label: 'Đang vận chuyển hoàn → CANCELLED', group: 'Kết thúc' },
    { value: 'returned', label: 'Hoàn hàng thành công → CANCELLED', group: 'Kết thúc' },
    { value: 'lost', label: 'Thất lạc → CANCELLED', group: 'Kết thúc' },
    { value: 'damage', label: 'Hàng bị hư hỏng', group: 'Kết thúc' },
    { value: 'exception', label: 'Sự cố ngoài ý muốn', group: 'Kết thúc' },
];

const TYPE_OPTIONS = [
    { value: 'switch_status', label: 'switch_status — Thay đổi trạng thái (phổ biến nhất)' },
    { value: 'create', label: 'create — GHN xác nhận tiếp nhận đơn' },
    { value: 'update_weight', label: 'update_weight — Cập nhật cân nặng' },
    { value: 'update_cod', label: 'update_cod — Cập nhật tiền COD' },
    { value: 'update_fee', label: 'update_fee — Cập nhật phí vận chuyển' },
];

export default function GhnSimulatorPage() {
    const [orderCode, setOrderCode] = useState('');
    const [status, setStatus] = useState('ready_to_pick');
    const [type, setType] = useState('switch_status');
    const [shopId, setShopId] = useState('199357');
    const [loading, setLoading] = useState(false);
    const [responseLog, setResponseLog] = useState(null);

    const handleSendWebhook = async (e) => {
        e.preventDefault();

        if (!orderCode.trim()) {
            return toast.error('Vui lòng nhập Mã vận đơn (Tracking Code)!');
        }

        setLoading(true);
        setResponseLog(null);

        // Payload chuẩn format tài liệu GHN
        const payload = {
            Type: type,
            Time: new Date().toISOString(),
            ShopID: shopId ? parseInt(shopId) : undefined,
            OrderCode: orderCode.trim().toUpperCase(),
            ClientOrderCode: '',
            Status: status,
            Description: STATUS_OPTIONS.find(s => s.value === status)?.label || status,
            Weight: 1000,
            ConvertedWeight: 1000,
            CODAmount: 0,
            TotalFee: 30000,
            Fee: {
                MainService: 30000,
                Insurance: 0,
                CODFee: 0,
                Coupon: 0,
                Total: 30000,
            },
            Reason: '',
            ReasonCode: '',
        };

        // Xóa field undefined để JSON gọn hơn
        if (!payload.ShopID) delete payload.ShopID;

        try {
            // Gọi trực tiếp /api/webhook/ghn (không qua api prefix, không cần JWT)
            const res = await axios.post('/api/webhook/ghn', payload, {
                // Override baseURL nếu cần — webhook không đi qua /api/v1
                baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
            });

            toast.success('Đã bắn Webhook thành công!');
            setResponseLog({
                type: 'success',
                data: res.data || 'Received',
                payloadSent: payload,
            });
        } catch (error) {
            toast.error('Lỗi khi bắn Webhook!');
            setResponseLog({
                type: 'error',
                data: error.response?.data || error.message,
                payloadSent: payload,
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedStatusInfo = STATUS_OPTIONS.find(s => s.value === status);
    const isTerminalStatus = selectedStatusInfo?.group === 'Kết thúc';

    return (
        <div className="max-w-5xl mx-auto p-6">

            {/* Header */}
            <div className="mb-8 border-b pb-5">
                <h1 className="text-2xl font-black text-orange-600 flex items-center gap-2 uppercase tracking-tight">
                    <Truck size={28} /> GHN Webhook Simulator
                </h1>
                <p className="text-gray-500 mt-2 text-sm max-w-2xl">
                    Giả lập tín hiệu webhook từ Giao Hàng Nhanh bắn về hệ thống.
                    Dùng để test luồng tự động cập nhật trạng thái đơn hàng và tracking message.
                </p>
            </div>

            {/* Info box */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
                <div>
                    <p className="font-semibold mb-1">Cách sử dụng:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Vào trang <strong>Đơn hàng</strong>, chọn đơn đang ở trạng thái <code>SHIPPING</code></li>
                        <li>Copy <strong>Mã vận đơn</strong> (Tracking Code) của đơn đó</li>
                        <li>Dán vào ô bên dưới, chọn trạng thái muốn giả lập, bấm <strong>BẮN WEBHOOK</strong></li>
                        <li>Quay lại trang đơn hàng, refresh và kiểm tra trạng thái đã được cập nhật chưa</li>
                    </ol>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* FORM */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-orange-200 p-6">
                    <form onSubmit={handleSendWebhook} className="space-y-5">

                        {/* Mã vận đơn */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Mã vận đơn (OrderCode) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 font-mono font-bold text-orange-700 uppercase tracking-widest"
                                placeholder="VD: LT8EWV"
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Lấy từ cột "Mã vận đơn" trong trang Đơn hàng Admin.
                            </p>
                        </div>

                        {/* ShopID (tùy chọn) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                ShopID <span className="text-gray-400 font-normal">(tùy chọn)</span>
                            </label>
                            <input
                                type="number"
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 font-mono text-gray-600"
                                placeholder="VD: 4905307 (để trống = bỏ qua validate)"
                                value={shopId}
                                onChange={(e) => setShopId(e.target.value)}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Phải khớp với <code>shipping.ghn.shop-id</code> trong config.
                            </p>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Loại sự kiện (Type)
                            </label>
                            <select
                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 bg-white text-sm text-gray-700"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                {TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status — chỉ hiện khi type = switch_status */}
                        {type === 'switch_status' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                    Trạng thái (Status)
                                </label>
                                <select
                                    className={`w-full border-2 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500 bg-white font-medium text-sm
                                        ${isTerminalStatus ? 'border-red-300 text-red-700' : 'border-gray-200 text-gray-700'}`}
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    {['Đang vận chuyển', 'Kết thúc'].map(group => (
                                        <optgroup key={group} label={`── ${group} ──`}>
                                            {STATUS_OPTIONS.filter(o => o.group === group).map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.value} — {opt.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>

                                {isTerminalStatus && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">
                                        ⚠️ Trạng thái này sẽ thay đổi OrderStatus trong database!
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-200"
                        >
                            {loading
                                ? <><RefreshCw size={18} className="animate-spin" /> ĐANG BẮN...</>
                                : <><Send size={18} /> BẮN WEBHOOK NGAY</>
                            }
                        </button>
                    </form>
                </div>

                {/* LOG CONSOLE */}
                <div className="lg:col-span-3 bg-[#1e1e1e] rounded-xl shadow-inner border border-gray-800 p-4 font-mono text-sm flex flex-col min-h-[480px]">

                    {/* Thanh tiêu đề terminal giả */}
                    <div className="flex items-center gap-2 border-b border-gray-700 pb-3 mb-3 text-gray-400">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <span className="ml-2 font-bold text-xs uppercase tracking-widest text-gray-500">
                            Terminal — Webhook Log
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {!responseLog ? (
                            <p className="text-gray-500 italic">Waiting for webhook trigger...</p>
                        ) : (
                            <div className="space-y-4 animate-fade-in">

                                {/* Request */}
                                <div>
                                    <p className="text-blue-400 font-bold mb-1">
                                        POST /api/webhook/ghn
                                    </p>
                                    <p className="text-gray-400 text-xs mb-1">Payload:</p>
                                    <pre className="text-yellow-300 bg-black/30 p-3 rounded-lg overflow-x-auto text-xs leading-relaxed">
                                        {JSON.stringify(responseLog.payloadSent, null, 2)}
                                    </pre>
                                </div>

                                {/* Response */}
                                <div className="border-t border-gray-700 pt-3">
                                    <p className="text-gray-400 text-xs mb-1">Response:</p>
                                    {responseLog.type === 'success' ? (
                                        <div className="text-green-400 flex items-start gap-2 bg-green-400/10 p-3 rounded-lg">
                                            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-bold text-sm">200 OK — Webhook processed</p>
                                                <pre className="whitespace-pre-wrap text-xs mt-1 text-green-300">
                                                    {typeof responseLog.data === 'string'
                                                        ? responseLog.data
                                                        : JSON.stringify(responseLog.data, null, 2)}
                                                </pre>
                                                <p className="text-xs text-green-500 mt-2">
                                                    ✓ Kiểm tra trang Đơn hàng để xem trạng thái đã cập nhật chưa.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-red-400 flex items-start gap-2 bg-red-400/10 p-3 rounded-lg">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-bold text-sm">Error</p>
                                                <pre className="whitespace-pre-wrap text-xs mt-1">
                                                    {typeof responseLog.data === 'string'
                                                        ? responseLog.data
                                                        : JSON.stringify(responseLog.data, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}