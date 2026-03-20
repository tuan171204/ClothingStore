'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '@/services/authService';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [adminUser, setAdminUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const loadAdmin = async () => {
            const token = localStorage.getItem('admin_token');
            if (token) {
                try {
                    const response = await authService.getMyInfo();

                    const role = response.result.role.name;
                    const hasAdminAccess = role === 'ADMIN' || role === 'STAFF' || role === 'SUPER_ADMIN';

                    if (hasAdminAccess) {
                        setAdminUser(response.result);
                    } else {
                        throw new Error("Không đủ quyền truy cập Admin");
                    }
                } catch (error) {
                    console.error("Token Admin hết hạn hoặc không hợp lệ:", error);
                    localStorage.removeItem('admin_token');
                    if (pathname !== '/admin/login') router.push('/admin/login');
                }
            } else {
                if (pathname !== '/admin/login') router.push('/admin/login');
            }
            setLoading(false);
        };
        loadAdmin();
    }, [pathname, router]);

    const login = async (username, password) => {
        try {
            const data = await authService.login(username, password);
            const token = data.result.token;
            localStorage.setItem('admin_token', token);

            const userInfo = await authService.getMyInfo();
            const role = userInfo.result.role.name;
            console.log(role)
            const hasAdminAccess = role === 'ADMIN' || role === 'STAFF' || role === 'SUPER_ADMIN';

            if (hasAdminAccess) {
                setAdminUser(userInfo.result);
                router.push('/admin/dashboard');
            } else {
                localStorage.removeItem('admin_token');
                throw new Error("Tài khoản của bạn không có quyền truy cập trang quản trị!");
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            await authService.logout(token).catch(e => console.error(e));
        }
        localStorage.removeItem('admin_token');
        setAdminUser(null);
        router.push('/admin/login');
    };

    return (
        <AdminAuthContext.Provider value={{ adminUser, loading, login, logout }}>
            {/* Trong lúc đang check token thì không render component con để tránh nhấp nháy UI */}
            {!loading && children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);