'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // 1. Tự động kiểm tra Token khi load trang
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await authService.getMyInfo();
                    setUser(response.result);
                } catch (error) {
                    console.error("Phiên đăng nhập đã hết hạn hoàn toàn!");
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    // 2.1 Hàm Đăng nhập (Dùng trong trang Login)
    const login = async (username, password) => {
        // Lấy token
        const data = await authService.login(username, password);
        const token = data.result.token;
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', token);

        // Lấy thông tin user ngay sau khi có token
        const userInfo = await authService.getMyInfo();
        setUser(userInfo.result);
        return userInfo.result; // Trả về thông tin để Component ngoài biết Role là gì (Admin hay User)
    };

    // 2.2 Hàm Đăng nhập Google (Headless OAuth2)
    const loginWithGoogleToken = async (idToken) => {
        // Gửi idToken lên Backend (Spring Boot) để verify và lấy Custom JWT
        const data = await authService.googleLogin(idToken);
        const token = data.result.token;

        // Lưu Custom JWT vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', token);

        // Fetch lại thông tin User (Lúc này Backend đã nhận diện được user qua token mới)
        const userInfo = await authService.getMyInfo();
        setUser(userInfo.result);
        return userInfo.result;
    };

    // 3. Hàm Đăng xuất
    const logout = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            // Gọi Backend để đưa token vào blacklist (Tùy chọn)
            await authService.logout(token).catch(e => console.error(e));
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        router.push('/login'); // Đá về trang login
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <AuthContext.Provider value={{ user, loading, login, loginWithGoogleToken, logout, }}>
                {children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
};

export const useAuth = () => useContext(AuthContext);