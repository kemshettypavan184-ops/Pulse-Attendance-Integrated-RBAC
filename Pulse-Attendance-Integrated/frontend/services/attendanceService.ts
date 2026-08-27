import {apiFetch} from '@/lib/api'; import type {AttendanceRecord} from '@/types/attendance'; import type {Role} from '@/types/auth';
export function fetchAttendance(role:Role){return apiFetch<AttendanceRecord[]>(role==='EMPLOYEE'?'/api/v1/me/attendance':'/api/v1/attendance');}
