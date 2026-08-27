import {apiFetch} from '@/lib/api'; import type {AuthResponse} from '@/types/auth';
export function login(username:string,password:string){return apiFetch<AuthResponse>('/api/v1/auth/login',{method:'POST',body:JSON.stringify({username,password})});}
export function signup(payload:{username:string;email:string;fullName:string;password:string}){return apiFetch('/api/v1/auth/signup',{method:'POST',body:JSON.stringify(payload)});}
