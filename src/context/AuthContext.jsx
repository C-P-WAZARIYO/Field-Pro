// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on refresh
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // If we have a stored access token, ensure it's attached
                const token = localStorage.getItem('accessToken');
                if (token) {
                    API.defaults.headers.common.Authorization = `Bearer ${token}`;
                    const res = await API.get('/auth/me'); // Hits protected endpoint
                    setUser(res.data.data.user);
                } else {
                    // No token, user is not logged in
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth check failed:', err.message);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await API.post('/auth/login', { email, password });
            const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
                API.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
            }
            setUser(res.data.data.user);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
    };

    const logout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (e) {
            // ignore
        }
        localStorage.removeItem('accessToken');
        delete API.defaults.headers.common.Authorization;
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

// Helper function to normalize role names
const normalizeRole = (role) => {
    if (!role) return '';
    // Convert to lowercase and replace underscores with spaces
    return role.toLowerCase().replace(/_/g, ' ').trim();
};

// Helper function to get all role names from user object
export const getUserRoles = (user) => {
    if (!user || !user.roles) return [];
    if (Array.isArray(user.roles)) {
        return user.roles.map(r => (r.role?.name || r.name || '')).filter(Boolean).map(normalizeRole);
    }
    return [];
};

// Helper function to check if user has a specific role
export const hasRole = (user, roleName) => {
    if (!user) return false;
    const userRoles = getUserRoles(user);

    // If caller passed an array of roles, check any-match
    if (Array.isArray(roleName)) {
        return roleName.some(rn => hasRole(user, rn));
    }

    const normalizedRole = normalizeRole(roleName);

    // Admin and Super Admin are treated as the same role
    if (normalizedRole === 'admin' || normalizedRole === 'super admin') {
        return userRoles.some(role => role === 'admin' || role === 'super admin');
    }

    return userRoles.includes(normalizedRole);
};