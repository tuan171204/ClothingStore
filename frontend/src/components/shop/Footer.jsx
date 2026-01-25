import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-white text-lg font-bold mb-4">TechStore.vn</h3>
                    <p className="text-sm">Hệ thống bán lẻ hàng đầu dành cho sinh viên IT.</p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Liên kết</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/products" className="hover:text-white">Laptop Gaming</Link></li>
                        <li><Link href="/products" className="hover:text-white">Bàn phím cơ</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="#" className="hover:text-white">Chính sách bảo hành</Link></li>
                        <li><Link href="#" className="hover:text-white">Tra cứu đơn hàng</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
                    <p className="text-sm">Hotline: 1900 1000</p>
                    <p className="text-sm">Email: support@techstore.vn</p>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                &copy; {new Date().getFullYear()} TechStore. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;