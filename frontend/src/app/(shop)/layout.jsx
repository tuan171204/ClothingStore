import React from 'react';
import Header from '@/components/shop/Header';
import Footer from "@/components/shop/Footer"
import ChatbotWidget from '@/components/shop/ChatBotWidget';

export const metadata = {
    title: "ClothStore.vn - Thời trang phong cách",
    description: "Khám phá phong cách thời trang của riêng bạn.",
};

export default function ShopLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen relative w-full overflow-x-hidden">
            {/* Thanh điều hướng */}
            <Header />

            {/* Bỏ class bg-gray-50 ở đây để page.jsx tự quyết định màu nền từng khu vực */}
            <main className="grow w-full">
                {children}
            </main>

            {/* Bọc Footer trong 1 thẻ div có ID để thực hiện chức năng scroll */}
            <div id="footer">
                <Footer />
            </div>

            <ChatbotWidget />
        </div>
    );
}