// src/pages/EmailHashHandler.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OriaLogo from '../components/OriaLogo';
import { supabase } from '@/lib/supabase';

export default function EmailHashHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if there's an access_token in the hash
        const hash = window.location.hash;
        if (hash && hash.includes('access_token') && hash.includes('type=signup')) {
            // This is an email confirmation - redirect to verified page
            navigate('/verified', { replace: true });
        } else {
            // Regular landing page - check if user is logged in
            const checkUser = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    navigate('/chart', { replace: true });
                } else {
                    // Show landing page
                    // The Landing component will be rendered
                }
            };
            checkUser();
        }
    }, [navigate]);

    // Show loading while checking
    return (
        <div className="oria-page oria-page-center" style={{ gap: 16 }}>
            <OriaLogo className="oria-loading-logo animate-breathe" size={72} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
                Loading...
            </p>
        </div>
    );
}