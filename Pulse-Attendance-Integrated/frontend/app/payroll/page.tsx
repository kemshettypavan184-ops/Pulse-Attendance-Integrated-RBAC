'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch, ApiError } from '@/lib/api';

type Payroll = { id:number; employeeId:number; employeeName:string; month:string; baseSalary?:number; actualWorkingDays?:number; grossSalary?:number; deductions?:number; netSalary?:number };
type Employee = { id:number; employeeId:string; fullName:string; salary?:number; status:string };
const money = (v?: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(v ?? 0);
const localMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export default function PayrollPage() {
    const [records,setRecords] = useState<Payroll[]>([]);
    const [employees,setEmployees] = useState<Employee[]>([]);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState('');
    const [month,setMonth] = useState(localMonth());
    const [showForm,setShowForm] = useState(false);
    const [employeeId,setEmployeeId] = useState('');
    const [actualWorkingDays,setActualWorkingDays] = useState('22');
    const [saving,setSaving] = useState(false);
    const [deletingId,setDeletingId] = useState<number|null>(null);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const [payroll, employeeList] = await Promise.all([
                apiFetch<Payroll[]>(`/api/v1/payroll/month/${month}`),
                apiFetch<Employee[]>('/api/v1/employees'),
            ]);
            setRecords(payroll); setEmployees(employeeList);
        } catch (e) { setError(e instanceof ApiError ? e.message : 'Unable to load payroll records.'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [month]);
    const totals = useMemo(() => records.reduce((a,r)=>({gross:a.gross+(r.grossSalary??0),deductions:a.deductions+(r.deductions??0),net:a.net+(r.netSalary??0)}),{gross:0,deductions:0,net:0}),[records]);

    const generate = async (event: FormEvent) => {
        event.preventDefault();
        if (!employeeId || Number(actualWorkingDays) < 0 || Number(actualWorkingDays) > 31) { setError('Select an employee and enter working days between 0 and 31.'); return; }
        setSaving(true); setError('');
        try { await apiFetch(`/api/v1/payroll/generate?employeeId=${encodeURIComponent(employeeId)}&month=${encodeURIComponent(month)}&actualWorkingDays=${encodeURIComponent(actualWorkingDays)}`, { method:'POST' }); setShowForm(false); setEmployeeId(''); await load(); }
        catch (e) { setError(e instanceof ApiError ? e.message : 'Unable to generate payroll.'); }
        finally { setSaving(false); }
    };

    const remove = async (record: Payroll) => {
        if (!window.confirm(`Delete payroll for ${record.employeeName} for ${record.month}?`)) return;
        setDeletingId(record.id); setError('');
        try { await apiFetch(`/api/v1/payroll/${record.id}`, {method:'DELETE'}); await load(); }
        catch (e) { setError(e instanceof ApiError ? e.message : 'Unable to delete payroll record.'); }
        finally { setDeletingId(null); }
    };

    return <ProtectedRoute roles={['ADMIN','MANAGER']}><main className="app-page"><Navbar/><section className="content-shell">
        <div className="page-heading"><div><span className="eyebrow">Payroll management</span><h1>Payroll</h1><p>Generate and review payroll records for the selected month.</p></div><div className="page-actions"><button className="button primary" onClick={()=>setShowForm(true)}>+ Generate Payroll</button><Link href="/dashboard" className="button secondary">Back to dashboard</Link></div></div>
        {error && <div className="alert error">{error}</div>}
        <div className="surface-card payroll-toolbar"><label>Processing month<input type="month" value={month} onChange={e=>setMonth(e.target.value)} /></label><span>{records.length} payroll record{records.length===1?'':'s'}</span></div>
        {showForm && <div className="surface-card management-form-card"><div className="card-title-row"><div><span className="eyebrow">Payroll processing</span><h2>Generate Payroll</h2></div><button className="button secondary compact" onClick={()=>setShowForm(false)} disabled={saving}>Close</button></div><form className="form-grid management-form" onSubmit={generate}><label>Employee<select value={employeeId} onChange={e=>setEmployeeId(e.target.value)} required><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.fullName} ({e.employeeId})</option>)}</select></label><label>Actual working days<input type="number" min="0" max="31" value={actualWorkingDays} onChange={e=>setActualWorkingDays(e.target.value)} required /></label><div className="grid-full form-actions"><button type="button" className="button secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving?'Generating…':'Generate Payroll'}</button></div></form></div>}
        <div className="stat-grid"><div className="stat-card"><div className="stat-icon">₹</div><span>Gross payroll</span><strong>{money(totals.gross)}</strong><small>{month}</small></div><div className="stat-card"><div className="stat-icon">−</div><span>Deductions</span><strong>{money(totals.deductions)}</strong><small>{month}</small></div><div className="stat-card"><div className="stat-icon">✓</div><span>Net payroll</span><strong>{money(totals.net)}</strong><small>{month}</small></div></div>
        <div className="surface-card table-card" style={{marginTop:16}}>{loading?<div className="table-loading"><div className="spinner"/>Loading payroll...</div>:records.length===0?<div className="empty-state"><strong>No payroll records found</strong><span>Generate payroll for an employee to create a record for {month}.</span></div>:<div className="table-scroll"><table><thead><tr><th>Employee</th><th>Month</th><th>Working days</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Actions</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td><strong>{r.employeeName}</strong><small>Employee #{r.employeeId}</small></td><td>{r.month}</td><td>{r.actualWorkingDays ?? '—'}</td><td>{money(r.grossSalary)}</td><td>{money(r.deductions)}</td><td><strong>{money(r.netSalary)}</strong></td><td><button className="danger-button" disabled={deletingId===r.id} onClick={()=>remove(r)}>{deletingId===r.id?'Deleting…':'Delete'}</button></td></tr>)}</tbody></table></div>}</div>
    </section></main></ProtectedRoute>;
}
