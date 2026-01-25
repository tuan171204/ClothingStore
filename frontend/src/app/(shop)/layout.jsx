import React from 'react';
import Header from '@/components/shop/Header';
import Footer from "@/components/shop/Footer"


export const metadata = {
    title: "ClothStore.vn - Thời trang sinh viên",
    description: "Dự án quần áo thời trang",
};

export default function ShopLayout({ children }) {
    return (
        <html lang="vi">
            <body className="flex flex-col min-h-screen font-sans text-gray-800 bg-gray-50">
                {/* Provider bao bọc tất cả */}


                {/* Header đã tách riêng */}
                <Header />

                {/* Nội dung chính */}
                <main className="flex-1">
                    {children}
                </main>

                {/* Footer đã tách riêng */}
                <Footer />

            </body>
        </html>
    );
}