const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
    status: number;
    data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pulse_token') : null;
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        cache: 'no-store',
    });

    const text = await response.text();
    let body: any = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('pulse_token');
            localStorage.removeItem('pulse_user');
            window.location.href = '/login?expired=1';
        }
        const message = body?.message || body?.error || (response.status === 403 ? 'You do not have permission to perform this action.' : 'Request failed.');
        throw new ApiError(message, response.status, body);
    }

    return body?.data ?? body;
}

export { API_URL };
