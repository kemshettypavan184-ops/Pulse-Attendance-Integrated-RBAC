type AttendanceCardProps = {
    employeeName: string;
    department: string;
    status: string;
    time: string;
};

export default function AttendanceCard({ employeeName, department, status, time }: AttendanceCardProps) {
    return (
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700 }}>{employeeName}</div>
            <div style={{ color: '#6b7280', marginTop: 6 }}>{department}</div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: status === 'Present' ? '#dcfce7' : '#fef3c7', color: status === 'Present' ? '#166534' : '#92400e', padding: '4px 8px', borderRadius: 999 }}>{status}</span>
                <span>{time}</span>
            </div>
        </div>
    );
}
