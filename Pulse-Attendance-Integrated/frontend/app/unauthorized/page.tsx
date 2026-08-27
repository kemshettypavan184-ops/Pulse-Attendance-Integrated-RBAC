import Link from 'next/link';
export default function UnauthorizedPage(){return <main className="center-page"><div className="error-card"><span className="error-code">403</span><h1>Access denied</h1><p>Your account is authenticated, but this area is restricted to another role.</p><Link href="/dashboard" className="button primary">Back to dashboard</Link></div></main>}
