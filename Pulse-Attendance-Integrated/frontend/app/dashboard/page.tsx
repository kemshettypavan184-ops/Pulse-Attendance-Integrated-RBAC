'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AttendanceRecord } from '@/types/attendance';
import type { LeaveRecord } from '@/types/leave';
import type { EmployeeProfile } from '@/types/employee';

type Stats = {
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    pendingLeaves: number;
};

type Employee = {
    id: number;
    employeeId: string;
    fullName: string;
    email: string;
    department?: string;
    designation?: string;
    status: string;
    joinDate?: string;
};

type Attendance = {
    id: number;
    employeeId: number;
    employeeName: string;
    attendanceDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: string;
};

type Leave = {
    id: number;
    employeeId: number;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    numberOfDays: number;
    reason?: string;
    status: string;
};

type Payroll = {
    id: number;
    employeeId: number;
    employeeName: string;
    month: string;
    grossSalary?: number;
    deductions?: number;
    netSalary?: number;
};

const money = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const titleCase = (value: string) =>
    value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const timeValue = (value?: string) => value ? value.slice(0, 5) : '—';

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <ProtectedRoute>
            <main className="app-page">
                <Navbar />
                {user?.role === 'ADMIN'
                    ? <AdminDashboard />
                    : user?.role === 'EMPLOYEE'
                        ? <EmployeeDashboard />
                        : <ManagerDashboard />}
            </main>
        </ProtectedRoute>
    );
}


type IconName = 'users' | 'check' | 'x' | 'leave' | 'clock' | 'percent' | 'pending' | 'home' | 'calendar' | 'search' | 'refresh' | 'arrow' | 'payroll';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
    const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
    const paths: Record<IconName, ReactNode> = {
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
        check: <><path d="m5 12 4 4L19 6"/></>,
        x: <><path d="M6 6l12 12M18 6 6 18"/></>,
        leave: <><path d="M8 3h8"/><path d="M9 3v4h6V3"/><path d="M7 7h10l1 14H6L7 7Z"/></>,
        clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
        percent: <><path d="m19 5-14 14"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/></>,
        pending: <><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 1.5"/></>,
        home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
        calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
        search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
        refresh: <><path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/></>,
        arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
        payroll: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h5"/></>,
    };
    return <svg {...common}>{paths[name]}</svg>;
}

function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [payroll, setPayroll] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [busyLeave, setBusyLeave] = useState<number | null>(null);

    const localDate = new Date();
    const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    const currentMonth = today.slice(0, 7);

    const loadDashboard = async () => {
        setLoading(true);
        setError('');

        try {
            const results = await Promise.allSettled([
                apiFetch<Stats>('/api/v1/dashboard/stats'),
                apiFetch<Employee[]>('/api/v1/employees'),
                apiFetch<Attendance[]>(`/api/v1/attendance/date/${today}`),
                apiFetch<Leave[]>('/api/v1/leaves/pending'),
                apiFetch<Payroll[]>(`/api/v1/payroll/month/${currentMonth}`),
            ]);

            const failures: string[] = [];

            if (results[0].status === 'fulfilled') setStats(results[0].value);
            else failures.push('dashboard statistics');

            if (results[1].status === 'fulfilled') setEmployees(results[1].value);
            else failures.push('employees');

            if (results[2].status === 'fulfilled') setAttendance(results[2].value);
            else failures.push('attendance');

            if (results[3].status === 'fulfilled') setLeaves(results[3].value);
            else failures.push('leave requests');

            if (results[4].status === 'fulfilled') setPayroll(results[4].value);
            // Payroll may legitimately have no generated records yet.

            if (failures.length) {
                setError(`Unable to load ${failures.join(', ')}. Check the backend/API permissions.`);
            }
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Could not load HR Admin dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'ADMIN') loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const departments = useMemo(
        () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean) as string[])).sort(),
        [employees]
    );

    const filteredAttendance = useMemo(() => attendance.filter((record) => {
        const employee = employees.find((e) => e.id === record.employeeId);
        const matchesSearch = `${record.employeeName} ${employee?.employeeId ?? ''} ${employee?.department ?? ''}`
            .toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
        const matchesDepartment = departmentFilter === 'ALL' || employee?.department === departmentFilter;
        return matchesSearch && matchesStatus && matchesDepartment;
    }), [attendance, employees, search, statusFilter, departmentFilter]);

    const departmentRows = useMemo(() => departments.map((department) => {
        const departmentEmployees = employees.filter((e) => e.department === department);
        const ids = new Set(departmentEmployees.map((e) => e.id));
        const departmentAttendance = attendance.filter((a) => ids.has(a.employeeId));
        const present = departmentAttendance.filter((a) => ['PRESENT', 'WORK_FROM_HOME'].includes(a.status)).length;
        const attendancePercentage = departmentEmployees.length
            ? Math.round((present / departmentEmployees.length) * 100)
            : 0;
        return { department, total: departmentEmployees.length, present, absent: departmentAttendance.filter((a) => a.status === 'ABSENT').length, leave: departmentEmployees.filter((e) => e.status === 'ON_LEAVE').length, attendancePercentage };
    }), [departments, employees, attendance]);

    const payrollTotals = useMemo(() => payroll.reduce((acc, record) => ({
        gross: acc.gross + (record.grossSalary ?? 0),
        deductions: acc.deductions + (record.deductions ?? 0),
        net: acc.net + (record.netSalary ?? 0),
    }), { gross: 0, deductions: 0, net: 0 }), [payroll]);

    const approveLeave = async (id: number) => {
        setBusyLeave(id);
        try {
            await apiFetch(`/api/v1/leaves/${id}/approve`, { method: 'PUT' });
            await loadDashboard();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to approve leave.');
        } finally {
            setBusyLeave(null);
        }
    };

    const rejectLeave = async (id: number) => {
        setBusyLeave(id);
        try {
            await apiFetch(`/api/v1/leaves/${id}/reject`, { method: 'PUT' });
            await loadDashboard();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to reject leave.');
        } finally {
            setBusyLeave(null);
        }
    };

    const attendancePercentage = stats && stats.totalEmployees
        ? Math.round((stats.present / stats.totalEmployees) * 100)
        : 0;

    return (
        <section className="content-shell admin-dashboard">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">HR Admin workspace</span>
                    <h1>Good morning, {user?.fullName.split(' ')[0]}.</h1>
                    <p>Here&apos;s your organization&apos;s workforce and attendance overview.</p>
                </div>
                <div className="admin-date">
                    <strong>{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</strong>
                    <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="admin-kpi-grid">
                <AdminKpi label="Total employees" value={stats?.totalEmployees} icon="users" />
                <AdminKpi label="Present today" value={stats?.present} icon="check" tone="success" />
                <AdminKpi label="Absent today" value={stats?.absent} icon="x" tone="danger" />
                <AdminKpi label="On leave" value={stats?.onLeave} icon="leave" tone="purple" />
                <AdminKpi label="Late arrivals" value={stats?.late} icon="clock" tone="warning" />
                <AdminKpi label="Attendance %" value={stats ? `${attendancePercentage}%` : undefined} icon="percent" tone="success" />
                <AdminKpi label="Pending leaves" value={stats?.pendingLeaves} icon="pending" tone="warning" />
                <AdminKpi label="WFH today" value={attendance.filter((a) => a.status === 'WORK_FROM_HOME').length} icon="home" />
            </div>

            <div className="admin-main-grid">
                <section className="surface-card admin-panel">
                    <div className="panel-heading">
                        <div>
                            <span className="eyebrow">Live workforce</span>
                            <h2>Today&apos;s Attendance</h2>
                        </div>
                        <button className="button secondary compact" onClick={loadDashboard} disabled={loading}>
                            {loading ? 'Refreshing…' : <><Icon name="refresh" size={15} /> Refresh</>}
                        </button>
                    </div>
                    <div className="attendance-overview">
                        <AttendanceMetric label="Present" value={stats?.present ?? 0} className="present" />
                        <AttendanceMetric label="Late" value={stats?.late ?? 0} className="late" />
                        <AttendanceMetric label="Absent" value={stats?.absent ?? 0} className="absent" />
                        <AttendanceMetric label="On Leave" value={stats?.onLeave ?? 0} className="leave" />
                        <AttendanceMetric label="WFH" value={attendance.filter((a) => a.status === 'WORK_FROM_HOME').length} className="wfh" />
                    </div>
                    <div className="filter-row">
                        <div className="search-box wide-search"><span className="icon-inline"><Icon name="search" size={16} /></span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee, ID or department..." /></div>
                        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}><option value="ALL">All departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option value="PRESENT">Present</option><option value="LATE">Late</option><option value="ABSENT">Absent</option><option value="HALF_DAY">Half day</option><option value="WORK_FROM_HOME">WFH</option></select>
                    </div>
                    <div className="table-scroll">
                        <table>
                            <thead><tr><th>Employee</th><th>Department</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead>
                            <tbody>
                                {filteredAttendance.length ? filteredAttendance.slice(0, 10).map((record) => {
                                    const employee = employees.find((e) => e.id === record.employeeId);
                                    return <tr key={record.id}>
                                        <td><strong>{record.employeeName}</strong><small>{employee?.employeeId ?? `#${record.employeeId}`}</small></td>
                                        <td>{employee?.department || '—'}</td>
                                        <td>{timeValue(record.checkInTime)}</td>
                                        <td>{timeValue(record.checkOutTime)}</td>
                                        <td><span className={`status-badge ${record.status.toLowerCase()}`}>{titleCase(record.status)}</span></td>
                                    </tr>;
                                }) : <tr><td colSpan={5} className="table-empty">No attendance records match the selected filters.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="surface-card admin-panel">
                    <div className="panel-heading">
                        <div><span className="eyebrow">Needs attention</span><h2>Leave Requests</h2></div>
                        <span className="count-pill">{leaves.length} pending</span>
                    </div>
                    {leaves.length ? leaves.slice(0, 5).map((leave) => (
                        <div className="leave-item" key={leave.id}>
                            <div className="leave-avatar">{leave.employeeName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</div>
                            <div className="leave-info">
                                <strong>{leave.employeeName}</strong>
                                <span>{titleCase(leave.leaveType)} · {leave.numberOfDays} day{leave.numberOfDays === 1 ? '' : 's'}</span>
                                <small>{leave.startDate} → {leave.endDate}</small>
                            </div>
                            <div className="leave-actions">
                                <button className="approve-button" disabled={busyLeave === leave.id} onClick={() => approveLeave(leave.id)}>Approve</button>
                                <button className="reject-button" disabled={busyLeave === leave.id} onClick={() => rejectLeave(leave.id)}>Reject</button>
                            </div>
                        </div>
                    )) : <div className="empty-state compact-empty"><strong>No pending leave requests</strong><span>Everything is up to date.</span></div>}
                </section>
            </div>

            <div className="admin-secondary-grid">
                <section className="surface-card admin-panel">
                    <div className="panel-heading"><div><span className="eyebrow">Workforce</span><h2>Department Overview</h2></div></div>
                    <div className="department-list">
                        {departmentRows.length ? departmentRows.map((row) => (
                            <div className="department-row" key={row.department}>
                                <div className="department-name"><strong>{row.department}</strong><span>{row.total} employee{row.total === 1 ? '' : 's'}</span></div>
                                <div className="department-progress"><div><span style={{ width: `${row.attendancePercentage}%` }} /></div><strong>{row.attendancePercentage}%</strong></div>
                                <div className="department-meta"><span>{row.present} present</span><span>{row.absent} absent</span><span>{row.leave} leave</span></div>
                            </div>
                        )) : <div className="empty-state compact-empty"><strong>No department data</strong><span>Department information will appear here.</span></div>}
                    </div>
                </section>

                <section className="surface-card admin-panel payroll-panel">
                    <div className="panel-heading"><div><span className="eyebrow">Current period</span><h2>Payroll Overview</h2></div><span className="count-pill">{currentMonth}</span></div>
                    {payroll.length ? <>
                        <div className="payroll-stat"><span>Employees processed</span><strong>{payroll.length}</strong></div>
                        <div className="payroll-stat"><span>Gross payroll</span><strong>{money(payrollTotals.gross)}</strong></div>
                        <div className="payroll-stat"><span>Deductions</span><strong>{money(payrollTotals.deductions)}</strong></div>
                        <div className="payroll-net"><span>Net payroll</span><strong>{money(payrollTotals.net)}</strong></div>
                    </> : <div className="empty-state compact-empty"><strong>No payroll generated</strong><span>Payroll data will appear after the current period is processed.</span></div>}
                </section>
            </div>

            <div className="admin-bottom-grid">
                <section className="surface-card admin-panel">
                    <div className="panel-heading"><div><span className="eyebrow">Quick access</span><h2>HR Actions</h2></div></div>
                    <div className="quick-actions">
                        <Link href="/employees?action=add" className="quick-action"><span className="quick-action-icon"><Icon name="users" size={18} /></span><strong>Add / Manage Employees</strong><small>Open workforce directory</small></Link>
                        <Link href="/attendance?mode=manage" className="quick-action"><span className="quick-action-icon"><Icon name="clock" size={18} /></span><strong>Attendance Management</strong><small>Review employee attendance</small></Link>
                        <Link href="/employees" className="quick-action"><span className="quick-action-icon"><Icon name="search" size={18} /></span><strong>Employee Search</strong><small>Find employee records</small></Link>
                    </div>
                </section>
                <section className="surface-card admin-panel">
                    <div className="panel-heading"><div><span className="eyebrow">HR pulse</span><h2>Recent workforce activity</h2></div></div>
                    <div className="activity-list">
                        {employees.slice().sort((a, b) => (b.joinDate || '').localeCompare(a.joinDate || '')).slice(0, 5).map((employee) => (
                            <div className="activity-item" key={employee.id}>
                                <div className="activity-dot" />
                                <div><strong>{employee.fullName}</strong><span>{employee.department || 'Employee'} · {employee.status.replaceAll('_', ' ')}</span></div>
                                <small>{employee.joinDate || '—'}</small>
                            </div>
                        ))}
                        {!employees.length && <div className="empty-state compact-empty"><strong>No recent activity</strong><span>Employee activity will appear here.</span></div>}
                    </div>
                </section>
            </div>
        </section>
    );
}

function AdminKpi({ label, value, icon, tone = '' }: { label: string; value?: string | number; icon: IconName; tone?: string }) {
    return <div className={`admin-kpi ${tone}`}><div className="kpi-icon"><Icon name={icon} size={19} /></div><div><span>{label}</span><strong>{value === undefined ? '—' : value}</strong></div></div>;
}

function AttendanceMetric({ label, value, className }: { label: string; value: number; className: string }) {
    return <div className={`attendance-metric ${className}`}><span>{label}</span><strong>{value}</strong></div>;
}


type DashboardStats = {
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    pendingLeaves: number;
};

type LoadState = 'loading' | 'ready' | 'error';

const formatTime = (value?: string | null) => {
    if (!value) return '—';
    const [hour, minute] = value.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

const workingMinutes = (record: AttendanceRecord) => {
    if (!record.checkInTime || !record.checkOutTime) return 0;
    const [ih, im] = record.checkInTime.split(':').map(Number);
    const [oh, om] = record.checkOutTime.split(':').map(Number);
    return Math.max(0, (oh * 60 + om) - (ih * 60 + im));
};

const formatHours = (minutes: number) => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
};

const statusLabel = (status: string) =>
    status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const statusClass = (status: string) => status.toLowerCase().replaceAll('_', '-');

const localDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const overlapDaysWithCurrentMonth = (startValue: string, endValue: string) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const start = new Date(`${startValue}T00:00:00`);
    const end = new Date(`${endValue}T00:00:00`);
    const from = start > monthStart ? start : monthStart;
    const to = end < monthEnd ? end : monthEnd;
    if (to < from) return 0;
    return Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
};

function StatCard({
    icon,
    label,
    value,
    helper,
    tone = 'blue',
}: {
    icon: IconName;
    label: string;
    value: string | number;
    helper: string;
    tone?: 'blue' | 'green' | 'amber' | 'red' | 'violet';
}) {
    return (
        <article className={`employee-stat-card ${tone}`}>
            <div className="employee-stat-icon"><Icon name={icon} size={18} /></div>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{helper}</small>
            </div>
        </article>
    );
}


function EmployeeDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
    const [state, setState] = useState<LoadState>('loading');
    const [error, setError] = useState('');
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [leaveType, setLeaveType] = useState('CASUAL_LEAVE');
    const [leaveStartDate, setLeaveStartDate] = useState('');
    const [leaveEndDate, setLeaveEndDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [submittingLeave, setSubmittingLeave] = useState(false);

    const loadDashboard = async () => {
        if (!user) return;
        setState('loading');
            setError('');

            try {
                const requests: [
                    Promise<DashboardStats>,
                    Promise<AttendanceRecord[]>,
                    Promise<LeaveRecord[]>,
                    Promise<EmployeeProfile | null>,
                ] = [
                    apiFetch<DashboardStats>('/api/v1/dashboard/stats'),
                    apiFetch<AttendanceRecord[]>('/api/v1/me/attendance'),
                    apiFetch<LeaveRecord[]>('/api/v1/me/leaves'),
                    user.employeeId
                        ? apiFetch<EmployeeProfile>('/api/v1/me/profile')
                        : Promise.resolve(null),
                ];

                const [statsData, attendanceData, leaveData, profileData] = await Promise.all(requests);
                setStats(statsData);
                setAttendance(attendanceData);
                setLeaves(leaveData);
                setProfile(profileData);
                setState('ready');
            } catch (err) {
                setState('error');
                setError(
                    err instanceof ApiError
                        ? err.message
                        : 'Unable to load your dashboard. Please check the backend connection.'
                );
            }
    };

    useEffect(() => {
        if (user) loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleCheckIn = async () => {
        if (!user?.employeeId) {
            setError('Your account is not linked to an employee profile.');
            return;
        }
        try {
            setError('');
            await apiFetch('/api/v1/me/attendance/check-in', { method: 'POST' });
            await loadDashboard();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Unable to check in.');
        }
    };

    const handleCheckOut = async () => {
        if (!user?.employeeId) {
            setError('Your account is not linked to an employee profile.');
            return;
        }
        try {
            setError('');
            await apiFetch('/api/v1/me/attendance/check-out', { method: 'PUT' });
            await loadDashboard();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Unable to check out.');
        }
    };

    const submitLeave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user?.employeeId) {
            setError('Your account is not linked to an employee profile.');
            return;
        }
        if (!leaveStartDate || !leaveEndDate || leaveEndDate < leaveStartDate) {
            setError('Please provide a valid leave date range.');
            return;
        }
        if (!leaveReason.trim()) {
            setError('Please provide a reason for your leave.');
            return;
        }
        const start = new Date(`${leaveStartDate}T00:00:00`);
        const end = new Date(`${leaveEndDate}T00:00:00`);
        const numberOfDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
        setSubmittingLeave(true);
        setError('');
        try {
            await apiFetch('/api/v1/me/leaves', {
                method: 'POST',
                body: JSON.stringify({
                    leaveType,
                    startDate: leaveStartDate,
                    endDate: leaveEndDate,
                    numberOfDays,
                    reason: leaveReason,
                    comments: '',
                }),
            });
            setShowLeaveForm(false);
            setLeaveReason('');
            setLeaveStartDate('');
            setLeaveEndDate('');
            await loadDashboard();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Unable to submit leave request.');
        } finally {
            setSubmittingLeave(false);
        }
    };

    const today = localDateKey(new Date());
    const todayRecord = attendance.find((record) => record.attendanceDate === today);

    const monthRecords = useMemo(() => {
        const now = new Date();
        return attendance.filter((record) => {
            const date = new Date(`${record.attendanceDate}T00:00:00`);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
    }, [attendance]);

    const monthPresent = monthRecords.filter((record) =>
        ['PRESENT', 'WORK_FROM_HOME'].includes(record.status)
    ).length;
    const monthLate = monthRecords.filter((record) => record.status === 'LATE').length;
    const monthAbsent = monthRecords.filter((record) => record.status === 'ABSENT').length;
    const monthLeave = leaves
        .filter((leave) => leave.status === 'APPROVED')
        .reduce((total, leave) => total + overlapDaysWithCurrentMonth(leave.startDate, leave.endDate), 0);
    const monthWfh = monthRecords.filter((record) => record.status === 'WORK_FROM_HOME').length;
    const monthMinutes = monthRecords.reduce((total, record) => total + workingMinutes(record), 0);

    const workingDays = useMemo(() => {
        const now = new Date();
        let count = 0;
        for (let day = 1; day <= now.getDate(); day += 1) {
            const date = new Date(now.getFullYear(), now.getMonth(), day);
            if (date.getDay() !== 0 && date.getDay() !== 6) count += 1;
        }
        return Math.max(count, monthRecords.length);
    }, [monthRecords]);

    const attendancePercentage = workingDays
        ? Math.min(100, Math.round((monthPresent / workingDays) * 100))
        : 0;

    const recentAttendance = [...attendance]
        .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
        .slice(0, 5);

    const recentLeaves = [...leaves]
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .slice(0, 4);

    const pendingLeaves = leaves.filter((leave) => leave.status === 'PENDING').length;
    const approvedLeaves = leaves.filter((leave) => leave.status === 'APPROVED').length;
    const rejectedLeaves = leaves.filter((leave) => leave.status === 'REJECTED').length;

    const firstName = profile?.fullName?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'there';
    const displayName = profile?.fullName || user?.fullName || 'Employee';
    const initials = displayName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <section className="content-shell employee-content">
                    <div className="employee-page-heading">
                        <div>
                            <span className="eyebrow">Employee workspace</span>
                            <h1>Good to see you, {firstName}!</h1>
                            <p>Here&apos;s your attendance and leave summary for today.</p>
                        </div>
                        <div className="employee-date-card">
                            <strong>
                                {new Date().toLocaleDateString([], {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </strong>
                            <span>{new Date().toLocaleDateString([], { year: 'numeric' })}</span>
                        </div>
                    </div>

                    {state === 'error' && <div className="alert error">{error}</div>}

                    <section className="employee-hero-card">
                        <div className="employee-profile">
                            <div className="employee-avatar">{initials}</div>
                            <div>
                                <div className="employee-name-row">
                                    <h2>{displayName}</h2>
                                    <span className="role-badge">EMPLOYEE</span>
                                </div>
                                <p>
                                    {profile?.designation || 'Employee'}
                                    {profile?.department ? ` · ${profile.department}` : ''}
                                </p>
                                <div className="employee-meta-row">
                                    <span>Employee ID: {profile?.employeeId || user?.employeeId || '—'}</span>
                                    {profile?.reportingManager && <span>Manager: {profile.reportingManager}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="employee-hero-actions">
                            <Link href="/attendance" className="button secondary">View attendance</Link>
                            <button
                                type="button"
                                className="button primary"
                                onClick={() => setShowLeaveForm(true)}
                            >
                                Apply for Leave
                            </button>
                        </div>
                    </section>

                    {showLeaveForm && (
                        <div className="leave-modal-backdrop" role="presentation">
                            <div className="surface-card leave-modal" role="dialog" aria-modal="true" aria-labelledby="leave-form-title">
                                <div className="card-title-row">
                                    <div>
                                        <span className="eyebrow">Employee leave</span>
                                        <h2 id="leave-form-title">Apply for Leave</h2>
                                    </div>
                                    <button type="button" className="button secondary compact" onClick={() => setShowLeaveForm(false)}>Close</button>
                                </div>
                                <form className="form-grid leave-form" onSubmit={submitLeave}>
                                    <label>
                                        Leave type
                                        <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                                            <option value="CASUAL_LEAVE">Casual Leave</option>
                                            <option value="SICK_LEAVE">Sick Leave</option>
                                            <option value="EARNED_LEAVE">Earned Leave</option>
                                            <option value="MATERNITY_LEAVE">Maternity Leave</option>
                                            <option value="PATERNITY_LEAVE">Paternity Leave</option>
                                            <option value="BEREAVEMENT_LEAVE">Bereavement Leave</option>
                                            <option value="SABBATICAL_LEAVE">Sabbatical Leave</option>
                                            <option value="UNPAID_LEAVE">Unpaid Leave</option>
                                        </select>
                                    </label>
                                    <label>
                                        Start date
                                        <input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} required />
                                    </label>
                                    <label>
                                        End date
                                        <input type="date" value={leaveEndDate} min={leaveStartDate || undefined} onChange={(e) => setLeaveEndDate(e.target.value)} required />
                                    </label>
                                    <label className="grid-full">
                                        Reason
                                        <textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Enter the reason for your leave" rows={4} />
                                    </label>
                                    <div className="grid-full form-actions">
                                        <button type="button" className="button secondary" onClick={() => setShowLeaveForm(false)}>Cancel</button>
                                        <button type="submit" className="button primary" disabled={submittingLeave}>{submittingLeave ? 'Submitting…' : 'Submit Leave Request'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <section className="today-attendance-card">
                        <div className="today-main">
                            <div className="section-kicker">Today&apos;s attendance</div>
                            <div className="today-title-row">
                                <div>
                                    <h2>{todayRecord ? statusLabel(todayRecord.status) : 'Not Marked'}</h2>
                                    <p>
                                        {todayRecord?.remarks ||
                                            (todayRecord ? 'Your attendance has been recorded for today.' : 'Your attendance has not been recorded yet.')}
                                    </p>
                                </div>
                                <span className={`large-status ${statusClass(todayRecord?.status || 'not_marked')}`}>
                                    <i />
                                    {statusLabel(todayRecord?.status || 'NOT_MARKED')}
                                </span>
                            </div>

                            <div className="today-metrics">
                                <div>
                                    <span>Check in</span>
                                    <strong>{formatTime(todayRecord?.checkInTime)}</strong>
                                </div>
                                <div>
                                    <span>Check out</span>
                                    <strong>{formatTime(todayRecord?.checkOutTime)}</strong>
                                </div>
                                <div>
                                    <span>Working hours</span>
                                    <strong>{formatHours(todayRecord ? workingMinutes(todayRecord) : 0)}</strong>
                                </div>
                                <div>
                                    <span>Work location</span>
                                    <strong>{todayRecord?.status === 'WORK_FROM_HOME' ? 'Work from home' : 'Office'}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="attendance-actions">
                            <button
                                type="button"
                                className="button primary"
                                disabled={Boolean(todayRecord?.checkInTime)}
                                onClick={handleCheckIn}
                            >
                                Check In
                            </button>
                            <button
                                type="button"
                                className="button secondary"
                                disabled={!todayRecord?.checkInTime || Boolean(todayRecord?.checkOutTime)}
                                onClick={handleCheckOut}
                            >
                                Check Out
                            </button>
                            <small>Attendance actions respect your authenticated employee access.</small>
                        </div>
                    </section>

                    <div className="employee-stat-grid">
                        <StatCard icon="check" label="Present days" value={state === 'loading' ? '—' : monthPresent} helper="This month" tone="green" />
                        <StatCard icon="clock" label="Late days" value={state === 'loading' ? '—' : monthLate} helper="This month" tone="amber" />
                        <StatCard icon="x" label="Absent days" value={state === 'loading' ? '—' : monthAbsent} helper="This month" tone="red" />
                        <StatCard icon="home" label="Work from home" value={state === 'loading' ? '—' : monthWfh} helper="This month" tone="blue" />
                        <StatCard icon="leave" label="Leave days" value={state === 'loading' ? '—' : monthLeave} helper="Recorded this month" tone="violet" />
                    </div>

                    <div className="employee-main-grid">
                        <section className="surface-card employee-month-card">
                            <div className="card-title-row">
                                <div>
                                    <span className="eyebrow">Monthly overview</span>
                                    <h2>This Month</h2>
                                </div>
                                <div className="attendance-percentage">
                                    <strong>{state === 'loading' ? '—' : `${attendancePercentage}%`}</strong>
                                    <span>attendance</span>
                                </div>
                            </div>

                            <div className="progress-track">
                                <span style={{ width: `${attendancePercentage}%` }} />
                            </div>

                            <div className="month-summary">
                                <div><span>Working days</span><strong>{workingDays}</strong></div>
                                <div><span>Present</span><strong>{monthPresent}</strong></div>
                                <div><span>Late</span><strong>{monthLate}</strong></div>
                                <div><span>Leave</span><strong>{monthLeave}</strong></div>
                                <div><span>Hours logged</span><strong>{formatHours(monthMinutes)}</strong></div>
                            </div>

                            <div className="attendance-calendar">
                                {Array.from({ length: new Date().getDate() }, (_, index) => {
                                    const day = index + 1;
                                    const date = new Date();
                                    date.setDate(day);
                                    const key = localDateKey(date);
                                    const record = monthRecords.find((item) => item.attendanceDate === key);
                                    return (
                                        <div key={key} className={`calendar-day ${record ? statusClass(record.status) : 'empty-day'}`} title={`${formatDate(key)}${record ? ` · ${statusLabel(record.status)}` : ' · No record'}`}>
                                            <span>{day}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="calendar-legend">
                                <span><i className="present" /> Present</span>
                                <span><i className="late" /> Late</span>
                                <span><i className="absent" /> Absent</span>
                                <span><i className="leave" /> Leave</span>
                                <span><i className="empty" /> No record</span>
                            </div>
                        </section>

                        <section className="surface-card leave-card">
                            <div className="card-title-row">
                                <div>
                                    <span className="eyebrow">My leave</span>
                                    <h2>Leave requests</h2>
                                </div>
                                <span className="pending-pill">{pendingLeaves} pending</span>
                            </div>

                            <div className="leave-counts">
                                <div><strong>{pendingLeaves}</strong><span>Pending</span></div>
                                <div><strong>{approvedLeaves}</strong><span>Approved</span></div>
                                <div><strong>{rejectedLeaves}</strong><span>Rejected</span></div>
                            </div>

                            <div className="leave-list">
                                {state === 'loading' ? (
                                    <div className="inline-loading"><div className="spinner" />Loading leave requests...</div>
                                ) : recentLeaves.length === 0 ? (
                                    <div className="small-empty">No leave requests yet.</div>
                                ) : (
                                    recentLeaves.map((leave) => (
                                        <div className="leave-item" key={leave.id}>
                                            <div>
                                                <strong>{statusLabel(leave.leaveType)}</strong>
                                                <span>{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</span>
                                            </div>
                                            <span className={`status-badge ${leave.status.toLowerCase()}`}>{statusLabel(leave.status)}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                type="button"
                                className="button secondary full"
                                onClick={() => setShowLeaveForm(true)}
                            >
                                Apply for Leave
                            </button>
                        </section>
                    </div>

                    <section className="surface-card recent-attendance-card">
                        <div className="card-title-row">
                            <div>
                                <span className="eyebrow">Attendance history</span>
                                <h2>Recent attendance</h2>
                            </div>
                            <Link href="/attendance" className="text-link">View all →</Link>
                        </div>

                        {state === 'loading' ? (
                            <div className="table-loading"><div className="spinner" />Loading attendance...</div>
                        ) : recentAttendance.length === 0 ? (
                            <div className="small-empty">No attendance records found for your account.</div>
                        ) : (
                            <div className="table-scroll">
                                <table className="employee-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Check in</th>
                                            <th>Check out</th>
                                            <th>Working hours</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentAttendance.map((record) => (
                                            <tr key={record.id}>
                                                <td><strong>{formatDate(record.attendanceDate)}</strong></td>
                                                <td>{formatTime(record.checkInTime)}</td>
                                                <td>{formatTime(record.checkOutTime)}</td>
                                                <td>{formatHours(workingMinutes(record))}</td>
                                                <td><span className={`status-badge ${statusClass(record.status)}`}>{statusLabel(record.status)}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="employee-notification-grid">
                        <div className="surface-card notification-card">
                            <div className="notification-icon">!</div>
                            <div>
                                <span className="eyebrow">Notifications</span>
                                <h3>Stay on top of your workday</h3>
                                <p>
                                    {todayRecord?.checkInTime && !todayRecord?.checkOutTime
                                        ? 'You are checked in. Remember to check out at the end of your workday.'
                                        : pendingLeaves > 0
                                            ? `You have ${pendingLeaves} leave request${pendingLeaves > 1 ? 's' : ''} awaiting approval.`
                                            : 'No urgent employee notifications right now.'}
                                </p>
                            </div>
                        </div>
                        <div className="surface-card notification-card compact">
                            <div className="notification-icon">i</div>
                            <div>
                                <span className="eyebrow">Profile</span>
                                <h3>{profile?.department || 'Employee profile'}</h3>
                                <p>{profile?.designation || 'Your employee profile is linked to this account.'}</p>
                            </div>
                        </div>
                    </section>
        </section>
    );
}

function ManagerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) apiFetch<Stats>('/api/v1/dashboard/stats')
            .then(setStats)
            .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load dashboard statistics.'));
    }, [user]);

    return (
        <section className="content-shell">
            <div className="page-heading">
                <div><span className="eyebrow">{user?.role} workspace</span><h1>Good to see you, {user?.fullName.split(' ')[0]}.</h1><p>Latest attendance picture for your access level.</p></div>
                <div className="date-pill">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            </div>
            {error && <div className="alert error">{error}</div>}
            <div className="stat-grid">
                <Stat label="Total employees" value={stats?.totalEmployees} icon="◉" />
                <Stat label="Present today" value={stats?.present} icon="check" />
                <Stat label="Late today" value={stats?.late} icon="clock" />
                <Stat label="Absent today" value={stats?.absent} icon="—" />
                <Stat label="On leave" value={stats?.onLeave} icon="leave" />
                <Stat label="Pending leaves" value={stats?.pendingLeaves} icon="pending" />
            </div>
        </section>
    );
}


function Stat({ label, value, icon }: { label: string; value?: number; icon: string }) {
    return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value === undefined ? '—' : value}</strong><small>Live API value</small></div>;
}
