// src/pages/EmailHashHandler.tsx
import { useEffect } from 'react';

export default function EmailHashHandler() {
    useEffect(() => {
        const hash = window.location.hash;

        if (hash && hash.includes('access_token') && hash.includes('type=signup')) {
            // Force a full page redirect to clear the hash
            window.location.href = '/verified';
        } else {
            // Check if user is logged in
            import('../lib/supabase').then(({ supabase }) => {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        window.location.href = '/chart';
                    } else {
                        // Show landing page by loading the actual landing content
                        window.location.href = '/';
                    }
                });
            });
        }
    }, []);

    return (
        <div className="oria-page oria-page-center" style={{ gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🌀</div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                    Redirecting...
                </p>
            </div>
        </div>
    );
}