import React, { useState } from 'react';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

export const AdminApp = () => {
    const [token, setToken] = useState(() => localStorage.getItem('admin_token'));

    const handleLogin = (token) => {
        localStorage.setItem('admin_token', token);
        setToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
    };

    if (!token) {
        return <AdminLogin onLogin={handleLogin} />;
    }

    return <AdminDashboard token={token} onLogout={handleLogout} />;
};
