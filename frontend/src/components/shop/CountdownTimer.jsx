'use client';

import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ endTime, onExpire }) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!endTime) return;

        const calculateTimeLeft = () => {
            const difference = new Date(endTime).getTime() - new Date().getTime();

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                if (onExpire) onExpire();
                return 0;
            }

            // Tính toán giờ, phút, giây (Hỗ trợ cả trường hợp > 24h gộp vào giờ)
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ hours, minutes, seconds });
            return difference;
        };

        // Chạy ngay lần đầu tiên
        const diff = calculateTimeLeft();

        // Nếu chưa hết hạn thì set Interval chạy mỗi giây
        if (diff > 0) {
            const timer = setInterval(calculateTimeLeft, 1000);
            return () => clearInterval(timer);
        }
    }, [endTime, onExpire]);

    const pad = (num) => String(num).padStart(2, '0');

    if (isExpired) {
        return <span className="text-gray-500 font-semibold text-md">Đã kết thúc</span>;
    }

    return (
        <div className="flex items-center gap-1.5">
            <TimeBox value={pad(timeLeft.hours)} />
            <span className="text-red-500 font-bold pb-0.5">:</span>
            <TimeBox value={pad(timeLeft.minutes)} />
            <span className="text-red-500 font-bold pb-0.5">:</span>
            <TimeBox value={pad(timeLeft.seconds)} />
        </div>
    );
}

const TimeBox = ({ value }) => (
    <div className="bg-red-600 text-white font-bold text-md min-w-[28px] h-7 flex items-center justify-center rounded">
        {value}
    </div>
);