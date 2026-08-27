'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types/auth';

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) router.replace('/login');
        else if (!isLoading && user && roles && !roles.includes(user.role)) router.replace('/unauthorized');
    }, [isLoading, user, roles, router]);

    if (isLoading || !user || (roles && !roles.includes(user.role))) {
        return <div className="page-loading"><div className="spinner" />Loading your Pulse workspace...</div>;
    }

    return <>{children}</>;
}
