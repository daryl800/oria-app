// src/pages/EmailHashHandler.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OriaLogo from '../components/OriaLogo';

export default function EmailHashHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        async function handleHash() {
            // Check if there's an access_token in the hash
            const hash = window.location.hash;
            if (hash && hash.includes('access_token') && hash.includes('type=signup')) {
                // This is an email confirmation - redirect to verified page
                navigate('/verified', { replace: true });
                return;
            }

            // Regular landing page - check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/chart', { replace: true });
            } else {
                // Show landing page (render the Landing component)
                // Since we're not redirecting, the router will show the Landing page
                // because this component is at the "/" route without a redirect
                navigate('/', { replace: true });
            }
        }

        handleHash();
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