'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { EmployeeProfile } from '@/types/employee';
import type { LeaveRecord } from '@/types/leave';

type LeaveFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const LEAVE_TYPES = [
    ['CASUAL_LEAVE', 'Casual Leave'],
    ['SICK_LEAVE', 'Sick Leave'],
    ['EARNED_LEAVE', 'Earned Leave'],
    ['MATERNITY_LEAVE', 'Maternity Leave'],
    ['PATERNITY_LEAVE', 'Paternity Leave'],
    ['BEREAVEMENT_LEAVE', 'Bereavement Leave'],
    ['SABBATICAL_LEAVE', 'Sabbatical Leave'],
    ['UNPAID_LEAVE', 'Unpaid Leave'],
] as const;

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const todayKey = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 10);
};

const calculateDays = (start: string, end: string) => {
    if (!start || !end || end < start) return 0;
    const startMs = Date.parse(`${start}T00:00:00`);
    const endMs = Date.parse(`${end}T00:00:00`);
    return Math.floor((endMs - startMs) / 86_400_000) + 1;
};

export default function LeavePage() {
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';
    const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
    const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState<LeaveFilter>('ALL');
    const [search, setSearch] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [leaveType, setLeaveType] = useState('CASUAL_LEAVE');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);

    const resetMessages = () => {
        setError('');
        setSuccess('');
    };

    const load = async () => {
        if (!user) return;
        setLoading(true);
        resetMessages();
        try {
            const path = isEmployee ? '/api/v1/me/leaves' : '/api/v1/leaves';
            const data = await apiFetch<LeaveRecord[]>(path);
            setLeaves(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to load leave records.');
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        if (!canManage) return;
        setLoadingEmployees(true);
        try {
            const data = await apiFetch<EmployeeProfile[]>('/api/v1/employees');
            setEmployees(Array.isArray(data) ? data : []);
            if (!selectedEmployeeId && data.length > 0) setSelectedEmployeeId(String(data[0].id));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to load employees for the leave form.');
        } finally {
            setLoadingEmployees(false);
        }
    };

    useEffect(() => {
        if (user) void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (showForm && canManage && employees.length === 0) void loadEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showForm, canManage]);

    const openForm = () => {
        resetMessages();
        setLeaveType('CASUAL_LEAVE');
        setStartDate(todayKey());
        setEndDate(todayKey());
        setReason('');
        if (isEmployee) setSelectedEmployeeId(user?.employeeId ? String(user.employeeId) : '');
        setShowForm(true);
        if (canManage) void loadEmployees();
    };

    const closeForm = () => {
        if (submitting) return;
        setShowForm(false);
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        resetMessages();

        if (!startDate || !endDate || endDate < startDate) {
            setError('Enter a valid leave date range.');
            return;
        }
        if (!reason.trim()) {
            setError('Reason is required.');
            return;
        }
        if (canManage && !selectedEmployeeId) {
            setError('Select an employee before submitting the leave request.');
            return;
        }
        if (isEmployee && !user?.employeeId) {
            setError('Your account is not linked to an employee profile. Please ask an administrator to link the account.');
            return;
        }

        const numberOfDays = calculateDays(startDate, endDate);
        setSubmitting(true);
        try {
            const payload = {
                ...(canManage ? { employeeId: Number(selectedEmployeeId) } : {}),
                leaveType,
                startDate,
                endDate,
                numberOfDays,
                reason: reason.trim(),
                comments: '',
            };

            await apiFetch<LeaveRecord>(isEmployee ? '/api/v1/me/leaves' : '/api/v1/leaves', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setShowForm(false);
            setSuccess('Leave request submitted successfully.');
            await load();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to submit leave request.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateLeave = async (id: number, action: 'approve' | 'reject') => {
        setBusyId(id);
        resetMessages();
        try {
            await apiFetch<LeaveRecord>(`/api/v1/leaves/${id}/${action}`, { method: 'PUT' });
            setSuccess(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
            await load();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : `Unable to ${action} leave request.`);
        } finally {
            setBusyId(null);
        }
    };

    const deleteLeave = async (id: number) => {
        if (!window.confirm('Delete this leave request?')) return;
        setBusyId(id);
        resetMessages();
        try {
            await apiFetch(`/api/v1/leaves/${id}`, { method: 'DELETE' });
            setSuccess('Leave request deleted successfully.');
            await load();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to delete leave request.');
        } finally {
            setBusyId(null);
        }
    };

    const visibleLeaves = useMemo(() => {
        const query = search.trim().toLowerCase();
        return leaves.filter((leave) => {
            const matchesFilter = filter === 'ALL' || leave.status === filter;
            const haystack = `${leave.employeeName} ${leave.employeeId} ${leave.leaveType} ${leave.reason || ''}`.toLowerCase();
            return matchesFilter && (!query || haystack.includes(query));
        });
    }, [leaves, filter, search]);

    const counts = useMemo(() => ({
        all: leaves.length,
        pending: leaves.filter(l => l.status === 'PENDING').length,
        approved: leaves.filter(l => l.status === 'APPROVED').length,
        rejected: leaves.filter(l => l.status === 'REJECTED').length,
    }), [leaves]);

    return (
        <ProtectedRoute>
            <main className="app-page">
                <Navbar />
                <section className="content-shell">
                    <div className="page-heading">
                        <div>
                            <span className="eyebrow">Leave management</span>
                            <h1>{isEmployee ? 'My Leave' : 'Leave Requests'}</h1>
                            <p>{isEmployee ? 'Apply for leave and track your requests.' : 'Review, create and process employee leave requests.'}</p>
                        </div>
                        <div className="page-actions">
                            <button className="button secondary" onClick={() => void load()} disabled={loading}>Refresh</button>
                            <button className="button primary" onClick={openForm}>+ {isEmployee ? 'Apply for Leave' : 'Create Leave'}</button>
                        </div>
                    </div>

                    {error && <div className="alert error">{error}</div>}
                    {success && <div className="alert success">{success}</div>}

                    {showForm && (
                        <div className="surface-card leave-page-form">
                            <div className="card-title-row">
                                <div><span className="eyebrow">{isEmployee ? 'Employee leave' : 'Manager / HR leave'}</span><h2>New Leave Request</h2></div>
                                <button className="button secondary compact" onClick={closeForm} disabled={submitting}>Close</button>
                            </div>
                            <form className="form-grid" onSubmit={submit}>
                                {canManage && (
                                    <label className="grid-full">Employee
                                        <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} disabled={loadingEmployees || submitting} required>
                                            <option value="">{loadingEmployees ? 'Loading employees…' : 'Select employee'}</option>
                                            {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName} — {employee.employeeId}</option>)}
                                        </select>
                                    </label>
                                )}
                                <label>Leave type
                                    <select value={leaveType} onChange={e => setLeaveType(e.target.value)} disabled={submitting}>
                                        {LEAVE_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                                    </select>
                                </label>
                                <label>Start date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required disabled={submitting} /></label>
                                <label>End date<input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} required disabled={submitting} /></label>
                                <label>Number of days<input value={calculateDays(startDate, endDate)} readOnly /></label>
                                <label className="grid-full">Reason<textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} maxLength={2000} placeholder="Enter the reason for leave" required disabled={submitting} /></label>
                                <div className="grid-full form-actions">
                                    <button type="button" className="button secondary" onClick={closeForm} disabled={submitting}>Cancel</button>
                                    <button className="button primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Leave Request'}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="surface-card table-card">
                        <div className="table-toolbar leave-toolbar">
                            <div className="leave-filter-buttons">
                                {([['ALL', `All (${counts.all})`], ['PENDING', `Pending (${counts.pending})`], ['APPROVED', `Approved (${counts.approved})`], ['REJECTED', `Rejected (${counts.rejected})`]] as const).map(([value, text]) => (
                                    <button key={value} className={`button compact ${filter === value ? 'primary' : 'secondary'}`} onClick={() => setFilter(value)}>{text}</button>
                                ))}
                            </div>
                            <div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, leave type or reason..." /></div>
                        </div>

                        {loading ? <div className="table-loading"><div className="spinner" />Loading leave records...</div> : visibleLeaves.length === 0 ? (
                            <div className="empty-state">
                                <strong>{leaves.length === 0 ? 'No leave records found' : 'No matching leave requests'}</strong>
                                <span>{leaves.length === 0 ? (isEmployee ? 'Use “Apply for Leave” to create your first request.' : 'Use “Create Leave” to create a request for an employee, or ask an employee to apply.') : 'Change the filter or search text to view other requests.'}</span>
                                {leaves.length === 0 && <button className="button primary compact" onClick={openForm}>+ {isEmployee ? 'Apply for Leave' : 'Create Leave'}</button>}
                            </div>
                        ) : (
                            <div className="table-scroll">
                                <table>
                                    <thead><tr><th>Employee</th><th>Leave type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead>
                                    <tbody>
                                        {visibleLeaves.map(leave => (
                                            <tr key={leave.id}>
                                                <td><strong>{leave.employeeName}</strong><small>Employee #{leave.employeeId}</small></td>
                                                <td>{label(leave.leaveType)}</td>
                                                <td>{leave.startDate} → {leave.endDate}</td>
                                                <td>{leave.numberOfDays}</td>
                                                <td>{leave.reason || '—'}</td>
                                                <td><span className={`status-badge ${leave.status.toLowerCase().replaceAll('_', '-')}`}>{label(leave.status)}</span></td>
                                                {canManage && <td>
                                                    {leave.status === 'PENDING' ? <div className="action-row">
                                                        <button className="approve-button" disabled={busyId === leave.id} onClick={() => void updateLeave(leave.id, 'approve')}>{busyId === leave.id ? 'Working…' : 'Approve'}</button>
                                                        <button className="reject-button" disabled={busyId === leave.id} onClick={() => void updateLeave(leave.id, 'reject')}>Reject</button>
                                                    </div> : <button className="danger-button" disabled={busyId === leave.id} onClick={() => void deleteLeave(leave.id)}>{busyId === leave.id ? 'Deleting…' : 'Delete'}</button>}
                                                </td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </ProtectedRoute>
    );
}
