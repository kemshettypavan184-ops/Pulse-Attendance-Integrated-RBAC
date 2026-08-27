'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AttendanceRecord } from '@/types/attendance';

type Employee = { id: number; employeeId: string; fullName: string; department?: string; status: string };
type AttendanceForm = { employeeId: string; attendanceDate: string; checkInTime: string; checkOutTime: string; status: string; remarks: string };

const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const emptyForm = (): AttendanceForm => ({ employeeId: '', attendanceDate: todayLocal(), checkInTime: '09:00', checkOutTime: '', status: 'PRESENT', remarks: '' });
const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export default function AttendancePage() {
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';
    const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<AttendanceRecord | null>(null);
    const [form, setForm] = useState<AttendanceForm>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const attendancePath = isEmployee ? '/api/v1/me/attendance' : '/api/v1/attendance';
            const attendancePromise = apiFetch<AttendanceRecord[]>(attendancePath);
            const employeePromise = canManage ? apiFetch<Employee[]>('/api/v1/employees') : Promise.resolve([]);
            const [attendance, employeeList] = await Promise.all([attendancePromise, employeePromise]);
            setRecords(attendance);
            setEmployees(employeeList);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Unable to load attendance.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user) load(); }, [user]);

    useEffect(() => {
        if (canManage && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'manage') openCreate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage]);

    const filtered = useMemo(() => records.filter(r => `${r.employeeName} ${r.employeeId} ${r.status} ${r.attendanceDate}`.toLowerCase().includes(search.toLowerCase())), [records, search]);

    function openCreate() {
        setEditing(null); setForm(emptyForm()); setShowForm(true); setError('');
    }
    function openEdit(record: AttendanceRecord) {
        setEditing(record);
        setForm({ employeeId: String(record.employeeId), attendanceDate: record.attendanceDate, checkInTime: record.checkInTime?.slice(0, 5) || '', checkOutTime: record.checkOutTime?.slice(0, 5) || '', status: record.status, remarks: record.remarks || '' });
        setShowForm(true); setError('');
    }
    function closeForm() { if (!saving) { setShowForm(false); setEditing(null); } }
    function updateField(field: keyof AttendanceForm, value: string) { setForm(current => ({ ...current, [field]: value })); }

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.employeeId || !form.attendanceDate || !form.checkInTime) { setError('Employee, date and check-in time are required.'); return; }
        setSaving(true); setError('');
        const payload = { employeeId: Number(form.employeeId), attendanceDate: form.attendanceDate, checkInTime: form.checkInTime, checkOutTime: form.checkOutTime || null, status: form.status, remarks: form.remarks.trim() };
        try {
            if (editing) await apiFetch(`/api/v1/attendance/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            else await apiFetch('/api/v1/attendance', { method: 'POST', body: JSON.stringify(payload) });
            closeForm(); await load();
        } catch (e) { setError(e instanceof ApiError ? e.message : 'Unable to save attendance record.'); }
        finally { setSaving(false); }
    }

    async function remove(record: AttendanceRecord) {
        if (!window.confirm(`Delete attendance for ${record.employeeName} on ${record.attendanceDate}?`)) return;
        setDeletingId(record.id); setError('');
        try { await apiFetch(`/api/v1/attendance/${record.id}`, { method: 'DELETE' }); await load(); }
        catch (e) { setError(e instanceof ApiError ? e.message : 'Unable to delete attendance record.'); }
        finally { setDeletingId(null); }
    }

    return <ProtectedRoute>
        <main className="app-page"><Navbar/><section className="content-shell">
            <div className="page-heading"><div><span className="eyebrow">Attendance records</span><h1>Attendance</h1><p>{isEmployee ? 'Your recent attendance records.' : 'Review and manage employee attendance.'}</p></div><div className="page-actions">{canManage && <button className="button primary" onClick={openCreate}>+ Mark Attendance</button>}<Link href="/dashboard" className="button secondary">Back to dashboard</Link></div></div>
            {error && <div className="alert error">{error}</div>}
            {showForm && canManage && <div className="surface-card management-form-card"><div className="card-title-row"><div><span className="eyebrow">{editing ? 'Edit record' : 'New attendance'}</span><h2>{editing ? 'Update Attendance' : 'Mark Attendance'}</h2></div><button className="button secondary compact" onClick={closeForm} disabled={saving}>Close</button></div><form className="form-grid management-form" onSubmit={submit}>
                <label>Employee<select value={form.employeeId} onChange={e => updateField('employeeId', e.target.value)} required><option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeId})</option>)}</select></label>
                <label>Date<input type="date" value={form.attendanceDate} onChange={e => updateField('attendanceDate', e.target.value)} required /></label>
                <label>Check-in<input type="time" value={form.checkInTime} onChange={e => updateField('checkInTime', e.target.value)} required /></label>
                <label>Check-out<input type="time" value={form.checkOutTime} onChange={e => updateField('checkOutTime', e.target.value)} /></label>
                <label>Status<select value={form.status} onChange={e => updateField('status', e.target.value)}>{['PRESENT','LATE','ABSENT','HALF_DAY','WORK_FROM_HOME'].map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
                <label>Remarks<input value={form.remarks} onChange={e => updateField('remarks', e.target.value)} /></label>
                <div className="grid-full form-actions"><button type="button" className="button secondary" onClick={closeForm} disabled={saving}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Attendance' : 'Save Attendance'}</button></div>
            </form></div>}
            <div className="surface-card table-card"><div className="table-toolbar"><div><strong>{filtered.length}</strong><span> record{filtered.length === 1 ? '' : 's'}</span></div><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, status or date..." /></div></div>
                {loading ? <div className="table-loading"><div className="spinner"/>Loading attendance...</div> : filtered.length === 0 ? <div className="empty-state"><strong>No attendance records found</strong><span>{isEmployee ? 'Use the dashboard Check In action to create today’s record.' : 'Use Mark Attendance to add the first record.'}</span></div> : <div className="table-scroll"><table><thead><tr><th>Employee</th><th>Date</th><th>Check in</th><th>Check out</th><th>Status</th><th>Remarks</th>{canManage && <th>Actions</th>}</tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td><strong>{r.employeeName}</strong><small>ID #{r.employeeId}</small></td><td>{r.attendanceDate}</td><td>{r.checkInTime || '—'}</td><td>{r.checkOutTime || '—'}</td><td><span className={`status-badge ${r.status.toLowerCase().replaceAll('_','-')}`}>{label(r.status)}</span></td><td>{r.remarks || '—'}</td>{canManage && <td><div className="action-row"><button className="button secondary compact" onClick={() => openEdit(r)}>Edit</button><button className="danger-button" disabled={deletingId === r.id} onClick={() => remove(r)}>{deletingId === r.id ? 'Deleting…' : 'Delete'}</button></div></td>}</tr>)}</tbody></table></div>}
            </div>
        </section></main>
    </ProtectedRoute>;
}
