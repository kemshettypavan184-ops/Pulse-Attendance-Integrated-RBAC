'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { AuthResponse, AuthUser, Role } from '@/types/auth';

type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<AuthUser>;
    signup: (payload: { username: string; email: string; fullName: string; password: string }) => Promise<void>;
    logout: () => void;
    hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const stored = localStorage.getItem('pulse_user');
                const token = localStorage.getItem('pulse_token');
                if (!stored || !token) {
                    setIsLoading(false);
                    return;
                }

                const storedUser: AuthUser = JSON.parse(stored);
                setUser(storedUser);

                // Existing accounts created before employee linking may have a null
                // employeeId in local storage. Resolve the profile from the backend
                // so self-service attendance/leave starts working without a manual
                // browser-storage edit.
                if (storedUser.role === 'EMPLOYEE' && !storedUser.employeeId) {
                    try {
                        const profile = await apiFetch<{ id: number; employeeId: string }>('/api/v1/me/profile');
                        const nextUser = { ...storedUser, employeeId: profile.id };
                        localStorage.setItem('pulse_user', JSON.stringify(nextUser));
                        setUser(nextUser);
                    } catch {
                        // Keep the authenticated session. The dashboard will show a
                        // clear "not linked" message if the account has no employee.
                    }
                }
            } catch {
                localStorage.removeItem('pulse_user');
                localStorage.removeItem('pulse_token');
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await apiFetch<AuthResponse>('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        const nextUser: AuthUser = {
            username: response.username,
            email: response.email,
            fullName: response.fullName,
            role: response.role,
            employeeId: response.employeeId ?? null,
        };
        localStorage.setItem('pulse_token', response.token);
        localStorage.setItem('pulse_user', JSON.stringify(nextUser));
        setUser(nextUser);
        return nextUser;
    };

    const signup = async (payload: { username: string; email: string; fullName: string; password: string }) => {
        await apiFetch('/api/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    };

    const logout = () => {
        localStorage.removeItem('pulse_token');
        localStorage.removeItem('pulse_user');
        setUser(null);
        window.location.href = '/login';
    };

    const value = useMemo(() => ({
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        signup,
        logout,
        hasRole: (...roles: Role[]) => Boolean(user && roles.includes(user.role)),
    }), [user, isLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
}
