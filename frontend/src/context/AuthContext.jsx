'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // 1. Tự động kiểm tra Token khi load trang
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Nếu có token, lấy thông tin user từ Backend
                    const response = await authService.getMyInfo();
                    setUser(response.result); // Lưu vào state
                } catch (error) {
                    console.error("Token hết hạn hoặc lỗi:", error);
                    localStorage.removeItem('token'); // Xóa token hỏng
                }
            }
            setLoading(false); // Load xong
        };
        loadUser();
    }, []);

    // 2. Hàm Đăng nhập (Dùng trong trang Login)
    const login = async (username, password) => {
        // Lấy token
        const data = await authService.login(username, password);
        const token = data.result.token;
        localStorage.setItem('token', token);

        // Lấy thông tin user ngay sau khi có token
        const userInfo = await authService.getMyInfo();
        setUser(userInfo.result);
        return userInfo.result; // Trả về thông tin để Component ngoài biết Role là gì (Admin hay User)
    };

    // 3. Hàm Đăng xuất
    const logout = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            // Gọi Backend để đưa token vào blacklist (Tùy chọn)
            await authService.logout(token).catch(e => console.error(e));
        }
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login'); // Đá về trang login
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);