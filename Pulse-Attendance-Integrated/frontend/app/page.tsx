'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
    const { user, isLoading } = useAuth();

    return (
        <main className="landing-page">
            <section className="landing-shell">
                <div className="landing-copy">
                    <div className="eyebrow"><span className="dot" /> Secure workforce operations</div>
                    <h1>Attendance that keeps your <span>people in sync.</span></h1>
                    <p>Pulse gives employees, managers and HR teams one secure place to track attendance, review workforce activity and stay on top of the workday.</p>
                    <div className="hero-actions">
                        {!isLoading && user ? (
                            <Link className="button primary" href="/dashboard">Open Dashboard</Link>
                        ) : (
                            <>
                                <Link className="button primary" href="/login">Sign in</Link>
                                <Link className="button secondary" href="/signup">Create account</Link>
                            </>
                        )}
                    </div>
                    <div className="trust-row"><span>✓ JWT authentication</span><span>✓ Role-based access</span><span>✓ Live API data</span></div>
                </div>
                <div className="hero-panel">
                    <div className="panel-glow" />
                    <div className="mini-card">
                        <div><span className="mini-label">Today</span><strong>Attendance overview</strong></div>
                        <span className="live-pill">LIVE</span>
                    </div>
                    <div className="hero-stat-grid">
                        <div className="hero-stat"><span>Present</span><strong>Live</strong><small>from backend</small></div>
                        <div className="hero-stat"><span>Late</span><strong>Live</strong><small>from backend</small></div>
                        <div className="hero-stat"><span>On leave</span><strong>Live</strong><small>from backend</small></div>
                        <div className="hero-stat"><span>Access</span><strong>RBAC</strong><small>role protected</small></div>
                    </div>
                    <div className="hero-line"><span>Pulse workforce workspace</span><span>24/7</span></div>
                </div>
            </section>
        </main>
    );
}
