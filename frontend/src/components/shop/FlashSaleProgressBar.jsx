'use client';

import React from 'react';
import { Flame } from 'lucide-react'; // Đảm bảo bạn đã cài lucide-react

export default function FlashSaleProgressBar({ total, sold }) {
    // Đảm bảo không bị lỗi chia cho 0 hoặc bán lố
    const safeTotal = total && total > 0 ? total : 1;
    const safeSold = sold && sold > 0 ? sold : 0;

    let percent = Math.floor((safeSold / safeTotal) * 100);
    if (percent > 100) percent = 100;

    const isSoldOut = percent === 100;
    const isAlmostSoldOut = percent >= 85 && !isSoldOut;

    return (
        <div className="relative w-full h-5 bg-orange-200 rounded-full overflow-hidden mt-2">
            {/* Lớp nền chạy phần trăm (Gradient cam -> đỏ) */}
            <div
                className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${isSoldOut
                    ? 'bg-gray-400' // Nếu hết hàng thì xám đi
                    : 'bg-gradient-to-r from-orange-400 to-red-600'
                    }`}
                style={{ width: `${percent}%` }}
            ></div>

            {/* Chữ hiển thị đè lên trên */}
            <div className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-white uppercase tracking-wider z-10 drop-shadow-md">
                {isSoldOut ? (
                    'Vừa hết hàng'
                ) : isAlmostSoldOut ? (
                    <span className="flex items-center gap-1">
                        <Flame size={12} className="text-yellow-200 animate-pulse" />
                        Sắp cháy hàng
                    </span>
                ) : (
                    `Đã bán ${safeSold}`
                )}
            </div>

            {/* Hiệu ứng sọc chéo chéo mờ mờ cho thanh (Tùy chọn cho đẹp) */}
            {!isSoldOut && percent > 0 && (
                <div
                    className="absolute top-0 left-0 w-full h-full opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                        backgroundSize: '1rem 1rem'
                    }}
                ></div>
            )}
        </div>
    );
}