"use client"; // Bắt buộc để dùng hook
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from "@/context/CartContext";

const CartButton = () => {
    const { cartCount } = useCart();

    // Fix lỗi Hydration (Next.js server render khác client)
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition group">
            {/* Icon giỏ hàng */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600 group-hover:text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>

            {/* Badge số lượng (Chỉ hiện khi đã mounted để tránh lỗi mismatch) */}
            {mounted && cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                    {cartCount}
                </span>
            )}
        </Link>
    );
};

export default CartButton;