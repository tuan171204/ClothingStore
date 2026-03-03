"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from "@/context/CartContext";

// Đổi tên prop nhận vào thành isSolid
const CartButton = ({ isSolid }) => {
    const { cartCount } = useCart();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Link href="/cart" className={`relative p-2 rounded-full transition-all group ${isSolid ? 'hover:bg-gray-100' : 'hover:bg-white/10'
            }`}>
            {/* Icon giỏ hàng */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                className={`w-8 h-8 transition-transform group-hover:scale-110 ${isSolid ? 'text-gray-900' : 'text-white'
                    }`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>

            {/* Badge số lượng */}
            {mounted && cartCount > 0 && (
                <span className={`absolute top-0 right-0 inline-flex items-center justify-center px-3 py-2 text-xs font-bold leading-none transform translate-x-1/4 -translate-y-1/4 rounded-full shadow-md ${isSolid ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                    }`}>
                    {cartCount}
                </span>
            )}
        </Link>
    );
};

export default CartButton;