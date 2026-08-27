'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { href: '/attendance', label: 'Attendance', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { href: '/leave', label: 'Leave', roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { href: '/employees', label: 'Employees', roles: ['ADMIN', 'MANAGER'] },
    { href: '/payroll', label: 'Payroll', roles: ['ADMIN', 'MANAGER'] },
];

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null;

    const initials = user.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

    return (
        <header className="app-header">
            <div className="brand-wrap">
                <Link href="/dashboard" className="brand">
                    <span className="brand-mark">P</span>
                    <span>Pulse</span>
                </Link>
                <span className="brand-divider" />
                <span className="brand-caption">Attendance</span>
            </div>

            <nav className="top-nav">
                {navItems.filter((item) => item.roles.includes(user.role)).map((item) => (
                    <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="user-menu">
                <div className="avatar">{initials}</div>
                <div className="user-meta">
                    <strong>{user.fullName}</strong>
                    <span>{user.role}</span>
                </div>
                <button className="logout-button" onClick={logout}>Logout</button>
            </div>
        </header>
    );
}
