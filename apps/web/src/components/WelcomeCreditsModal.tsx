import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { markTrialPopupSeen } from '../services/api';

interface Props {
  onDone: () => void;
}

// Shown once to users inside their first-month credit window (60 credits,
// same as Plus). Not framed as a "trial" — just a warm welcome.
export default function WelcomeCreditsModal({ onDone }: Props) {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);

  async function handleClose() {
    setClosing(true);
    try {
      await markTrialPopupSeen();
    } catch {
      // non-fatal — worst case the popup shows again next session
    } finally {
      onDone();
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="oria-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
          {t('welcome_credits.title')}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.6 }}>
          {t('welcome_credits.body')}
        </p>
        <button
          onClick={handleClose}
          disabled={closing}
          className="oria-btn-primary"
          style={{ fontSize: 16, width: '100%' }}
        >
          {t('welcome_credits.cta')}
        </button>
      </div>
    </div>
  );
}
