import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { checkBillingSession } from '@/services/api';
import PlanetLoader from '@/components/PlanetLoader';

type Status = 'checking' | 'success' | 'timeout';

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    if (!sessionId) {
      setStatus('success');
      return;
    }

    let attempts = 0;
    const MAX = 10;

    const poll = async () => {
      try {
        const data = await checkBillingSession(sessionId);
        if (data.plan === 'plus') {
          setStatus('success');
          return;
        }
      } catch {
        // network hiccup — keep polling
      }
      attempts++;
      if (attempts >= MAX) {
        setStatus('timeout');
        return;
      }
      setTimeout(poll, 1800);
    };

    poll();
  }, [sessionId]);

  const handleContinue = () => {
    // Full page reload so App.tsx re-reads the updated plan from Supabase
    window.location.href = '/chart';
  };

  return (
    <div className="oria-page oria-page-center animate-fade-in">
      <div className="oria-card" style={{ textAlign: 'center', maxWidth: 420, padding: '48px 32px' }}>

        {status === 'checking' && (
          <>
            <PlanetLoader />
            <h2 className="text-xl" style={{ marginTop: 24, marginBottom: 12 }}>
              Activating your Plus plan…
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7 }}>
              Just a moment while we unlock everything for you.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
            <h2 className="text-xl" style={{ marginBottom: 12 }}>Welcome to oria Plus!</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Your full reading is ready. All Plus features are now unlocked.
            </p>
            <button type="button" className="oria-btn-primary" onClick={handleContinue}>
              Explore your chart →
            </button>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>⌛</div>
            <h2 className="text-xl" style={{ marginBottom: 12 }}>Payment received</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Your payment was successful. Your Plus plan may take a moment to activate — the app will reflect it once you continue.
            </p>
            <button type="button" className="oria-btn-primary" onClick={handleContinue}>
              Continue to oria
            </button>
          </>
        )}

      </div>
    </div>
  );
}
