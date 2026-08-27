import type { AttendanceRecord } from '@/types/attendance';

export default function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
    return <div className="surface-card table-card"><div className="table-scroll"><table><thead><tr><th>Employee</th><th>Date</th><th>Check in</th><th>Check out</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.employeeName}</td><td>{record.attendanceDate}</td><td>{record.checkInTime || '—'}</td><td>{record.checkOutTime || '—'}</td><td><span className={`status-badge ${record.status.toLowerCase()}`}>{record.status.replaceAll('_', ' ')}</span></td></tr>)}</tbody></table></div></div>;
}
