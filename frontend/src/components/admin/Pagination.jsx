'use client';
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable pagination bar — responsive mobile/desktop.
 */
export default function Pagination({ page, totalPages, totalElements, size, onPageChange, loading = false }) {
    if (!totalPages || totalPages <= 1) return null;

    const from = page * size + 1;
    const to = Math.min((page + 1) * size, totalElements);

    const buildPages = () => {
        const pages = [];
        const radius = 2;
        let start = Math.max(0, page - radius);
        let end = Math.min(totalPages - 1, page + radius);
        if (end - start < radius * 2) {
            start = Math.max(0, end - radius * 2);
            end = Math.min(totalPages - 1, start + radius * 2);
        }
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const pages = buildPages();

    const btn = (idKey, label, disabled, onClick, active = false) => (
        <button
            key={idKey}
            onClick={onClick}
            disabled={disabled || loading}
            className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-1.5 sm:px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all border
                ${active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : disabled || loading
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 bg-white cursor-pointer'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-t bg-gray-50/50 gap-2 sm:gap-0 flex-wrap">
            {/* Summary text — hidden on very small screens to save space */}
            <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap hidden xs:block sm:block">
                Hiển thị <span className="font-semibold text-gray-700">{from}–{to}</span> trong tổng số{' '}
                <span className="font-semibold text-gray-700">{totalElements?.toLocaleString()}</span> kết quả
            </p>

            <div className="flex items-center gap-1">
                {/* First & Prev — hide "first" on mobile to save space */}
                <span className="hidden sm:inline-flex">
                    {btn('first', <ChevronsLeft size={13} />, page === 0, () => onPageChange(0))}
                </span>
                {btn('prev', <ChevronLeft size={13} />, page === 0, () => onPageChange(page - 1))}

                {pages[0] > 0 && (
                    <>
                        {btn('page-1-first', 1, false, () => onPageChange(0))}
                        {pages[0] > 1 && <span className="px-1 text-gray-400 text-xs">…</span>}
                    </>
                )}

                {pages.map(p => btn(`page-${p}`, p + 1, false, () => onPageChange(p), p === page))}

                {pages[pages.length - 1] < totalPages - 1 && (
                    <>
                        {pages[pages.length - 1] < totalPages - 2 && (
                            <span className="px-1 text-gray-400 text-xs">…</span>
                        )}
                        {btn(`page-${totalPages}-last`, totalPages, false, () => onPageChange(totalPages - 1))}
                    </>
                )}

                {btn('next', <ChevronRight size={13} />, page >= totalPages - 1, () => onPageChange(page + 1))}
                {/* Last — hide on mobile */}
                <span className="hidden sm:inline-flex">
                    {btn('last', <ChevronsRight size={13} />, page >= totalPages - 1, () => onPageChange(totalPages - 1))}
                </span>
            </div>
        </div>
    );
}