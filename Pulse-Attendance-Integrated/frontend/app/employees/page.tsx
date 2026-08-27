'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { EmployeeProfile } from '@/types/employee';

type Employee = EmployeeProfile & { status: string };

type EmployeeForm = {
    employeeId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    joinDate: string;
    department: string;
    designation: string;
    status: string;
    reportingManager: string;
    salary: string;
};

const emptyForm: EmployeeForm = {
    employeeId: '', fullName: '', email: '', phoneNumber: '', dateOfBirth: '', joinDate: '',
    department: '', designation: '', status: 'ACTIVE', reportingManager: '', salary: '0',
};

const toForm = (employee: Employee): EmployeeForm => ({
    employeeId: employee.employeeId || '', fullName: employee.fullName || '', email: employee.email || '',
    phoneNumber: employee.phoneNumber || '', dateOfBirth: employee.dateOfBirth || '', joinDate: employee.joinDate || '',
    department: employee.department || '', designation: employee.designation || '', status: employee.status || 'ACTIVE',
    reportingManager: employee.reportingManager || '',
    salary: employee.salary == null ? '0' : String(employee.salary),
});

export default function EmployeesPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);
    const [form, setForm] = useState<EmployeeForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setEmployees(await apiFetch<Employee[]>('/api/v1/employees'));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to load employees.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user) load(); }, [user]);

    useEffect(() => {
        if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('action') === 'add') {
            setEditing(null);
            setForm({ ...emptyForm, joinDate: new Date().toISOString().slice(0, 10) });
            setShowForm(true);
        }
    }, []);

    const filtered = useMemo(() => employees.filter((e) =>
        `${e.fullName} ${e.employeeId} ${e.department || ''} ${e.email} ${e.designation || ''}`
            .toLowerCase().includes(search.toLowerCase())
    ), [employees, search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyForm, joinDate: new Date().toISOString().slice(0, 10) });
        setShowForm(true);
        setError('');
    };

    const openEdit = (employee: Employee) => {
        setEditing(employee);
        setForm(toForm(employee));
        setShowForm(true);
        setError('');
    };

    const closeForm = () => {
        if (saving) return;
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const updateField = (field: keyof EmployeeForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!form.employeeId || !form.fullName || !form.email || !form.dateOfBirth || !form.joinDate) {
            setError('Employee ID, name, email, date of birth and join date are required.');
            return;
        }
        setSaving(true);
        setError('');
        const payload = {
            employeeId: form.employeeId.trim(), fullName: form.fullName.trim(), email: form.email.trim(),
            phoneNumber: form.phoneNumber.trim(), dateOfBirth: form.dateOfBirth, joinDate: form.joinDate,
            department: form.department.trim(), designation: form.designation.trim(), status: form.status,
            reportingManager: form.reportingManager.trim(),
            salary: Number(form.salary || 0),
        };
        try {
            if (editing) {
                await apiFetch(`/api/v1/employees/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                await apiFetch('/api/v1/employees', { method: 'POST', body: JSON.stringify(payload) });
            }
            closeForm();
            await load();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to save employee.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (employee: Employee) => {
        if (!window.confirm(`Delete ${employee.fullName}? This action cannot be undone.`)) return;
        setDeletingId(employee.id);
        setError('');
        try {
            await apiFetch(`/api/v1/employees/${employee.id}`, { method: 'DELETE' });
            await load();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to delete employee.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
            <main className="app-page">
                <Navbar />
                <section className="content-shell">
                    <div className="page-heading">
                        <div><span className="eyebrow">Workforce directory</span><h1>Employees</h1><p>Manage employee records through the secured Spring Boot API.</p></div>
                        <div className="page-actions"><button className="button primary" onClick={openCreate}>+ Add Employee</button><Link href="/dashboard" className="button secondary">Back to dashboard</Link></div>
                    </div>
                    {error && <div className="alert error">{error}</div>}
                    {showForm && (
                        <div className="surface-card management-form-card">
                            <div className="card-title-row"><div><span className="eyebrow">{editing ? 'Edit employee' : 'New employee'}</span><h2>{editing ? `Update ${editing.fullName}` : 'Add Employee'}</h2></div><button className="button secondary compact" onClick={closeForm} disabled={saving}>Close</button></div>
                            <form className="form-grid management-form" onSubmit={submit}>
                                <label>Employee ID<input value={form.employeeId} onChange={e => updateField('employeeId', e.target.value)} required /></label>
                                <label>Full name<input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} required /></label>
                                <label>Email<input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} required /></label>
                                <label>Phone number<input value={form.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)} /></label>
                                <label>Date of birth<input type="date" value={form.dateOfBirth} onChange={e => updateField('dateOfBirth', e.target.value)} required /></label>
                                <label>Join date<input type="date" value={form.joinDate} onChange={e => updateField('joinDate', e.target.value)} required /></label>
                                <label>Department<input value={form.department} onChange={e => updateField('department', e.target.value)} /></label>
                                <label>Designation<input value={form.designation} onChange={e => updateField('designation', e.target.value)} /></label>
                                <label>Status<select value={form.status} onChange={e => updateField('status', e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ON_LEAVE">On Leave</option><option value="TERMINATED">Terminated</option><option value="SUSPENDED">Suspended</option></select></label>
                                <label>Salary<input type="number" min="0" step="0.01" value={form.salary} onChange={e => updateField('salary', e.target.value)} required /></label>
                                <label>Reporting manager<input value={form.reportingManager} onChange={e => updateField('reportingManager', e.target.value)} /></label>
                                <div className="grid-full form-actions"><button type="button" className="button secondary" onClick={closeForm} disabled={saving}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Employee' : 'Create Employee'}</button></div>
                            </form>
                        </div>
                    )}
                    <div className="surface-card table-card">
                        <div className="table-toolbar"><div><strong>{filtered.length}</strong><span> employee{filtered.length === 1 ? '' : 's'}</span></div><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." /></div></div>
                        {loading ? <div className="table-loading"><div className="spinner" />Loading employees...</div> : filtered.length === 0 ? <div className="empty-state"><strong>No employees found</strong><span>There are no matching employee records.</span></div> : (
                            <div className="table-scroll"><table><thead><tr><th>Employee</th><th>Email</th><th>Department</th><th>Designation</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map(e => (
                                <tr key={e.id}><td><strong>{e.fullName}</strong><small>{e.employeeId}</small></td><td>{e.email}</td><td>{e.department || '—'}</td><td>{e.designation || '—'}</td><td><span className={`status-badge ${e.status.toLowerCase().replaceAll('_', '-')}`}>{e.status.replaceAll('_', ' ')}</span></td><td><div className="action-row"><button className="button secondary compact" onClick={() => openEdit(e)}>Edit</button><button className="danger-button" disabled={deletingId === e.id} onClick={() => remove(e)}>{deletingId === e.id ? 'Deleting…' : 'Delete'}</button></div></td></tr>
                            ))}</tbody></table></div>
                        )}
                    </div>
                </section>
            </main>
        </ProtectedRoute>
    );
}
