import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBillingStatus, cancelSubscription, reactivateSubscription, createPortalSession } from '@/services/api';

interface BillingStatus {
  plan: string;
  plan_expires_at: string | null;
  plan_cancel_scheduled: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ManageSubscription({ isPlus }: { isPlus: boolean }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    getBillingStatus()
      .then(setStatus)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    setWorking(true);
    setError(null);
    try {
      const result = await cancelSubscription();
      setStatus(prev => prev ? { ...prev, ...result } : null);
      setConfirmCancel(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function handlePortal() {
    setWorking(true);
    setError(null);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message);
      setWorking(false);
    }
  }

  async function handleReactivate() {
    setWorking(true);
    setError(null);
    try {
      const result = await reactivateSubscription();
      setStatus(prev => prev ? { ...prev, ...result } : null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '28px 24px',
    marginBottom: 16,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#C9A84C',
    marginBottom: 6,
  };

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <header style={{ marginBottom: 28 }}>
        <div style={{ ...labelStyle, marginBottom: 8 }}>Account</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F0EDE8', margin: 0 }}>Manage Subscription</h1>
      </header>

      {loading && (
        <div style={{ ...cardStyle, color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', padding: '40px' }}>
          Loading…
        </div>
      )}

      {!loading && status && (
        <>
          {/* Plan status card */}
          <div style={{
            ...cardStyle,
            background: isPlus
              ? 'linear-gradient(135deg, rgba(201,168,76,0.10), rgba(124,58,237,0.07))'
              : 'rgba(255,255,255,0.03)',
            border: isPlus ? '1.5px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={labelStyle}>Current plan</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8' }}>
                  {isPlus ? 'Oria Plus' : 'Free'}
                </div>
              </div>
              {isPlus && (
                <div style={{
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.35)',
                  borderRadius: 99, padding: '6px 14px',
                  fontSize: 12, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.06em',
                }}>
                  ✦ PLUS
                </div>
              )}
            </div>

            {isPlus && status.plan_expires_at && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {status.plan_cancel_scheduled ? 'Access until' : 'Next renewal'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE8' }}>
                    {formatDate(status.plan_expires_at)}
                  </span>
                </div>

                {status.plan_cancel_scheduled && (
                  <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 12, padding: '12px 16px',
                    fontSize: 13, color: 'rgba(239,68,68,0.85)', lineHeight: 1.6,
                  }}>
                    Your subscription is set to cancel on {formatDate(status.plan_expires_at)}. After that, your account reverts to the Free plan.
                  </div>
                )}
              </div>
            )}

            {!isPlus && (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                Upgrade to Plus to unlock full chart insights, monthly focus, and unlimited guidance.
              </p>
            )}
          </div>

          {/* Actions */}
          {isPlus && (
            <div style={cardStyle}>
              <div style={{ ...labelStyle, marginBottom: 16 }}>Subscription actions</div>

              {status.plan_cancel_scheduled ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', lineHeight: 1.65 }}>
                    Changed your mind? Reactivate to keep Plus after {formatDate(status.plan_expires_at)}.
                  </p>
                  <button
                    onClick={handleReactivate}
                    disabled={working}
                    className="oria-btn-primary"
                    style={{ fontSize: 15 }}
                  >
                    {working ? 'Processing…' : 'Reactivate subscription'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={handlePortal}
                    disabled={working}
                    className="oria-btn-primary"
                    style={{ fontSize: 15 }}
                  >
                    {working ? 'Redirecting…' : 'Change plan'}
                  </button>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', lineHeight: 1.65, textAlign: 'center' }}>
                    Switch between monthly and yearly, update payment method, or view invoices.
                  </p>
                  <button
                    onClick={() => setConfirmCancel(true)}
                    disabled={working}
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 999, padding: '14px',
                      fontSize: 15, fontWeight: 600,
                      color: 'rgba(239,68,68,0.8)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel subscription
                  </button>
                </div>
              )}
            </div>
          )}

          {!isPlus && (
            <button
              onClick={() => navigate('/pricing')}
              className="oria-btn-primary"
              style={{ width: '100%', fontSize: 15, marginBottom: 16 }}
            >
              Upgrade to Plus →
            </button>
          )}
        </>
      )}

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12, padding: '14px 16px', marginTop: 8,
          fontSize: 14, color: 'rgba(239,68,68,0.85)',
        }}>
          {error}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div className="oria-card" style={{ maxWidth: 380, width: '100%', textAlign: 'center', padding: '36px 28px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
              Cancel subscription?
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 28 }}>
              Your Plus access stays active until <strong style={{ color: '#F0EDE8' }}>{formatDate(status?.plan_expires_at ?? null)}</strong>. After that, your account reverts to Free.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmCancel(false)}
                disabled={working}
                style={{
                  flex: 1, padding: '14px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 15,
                }}>
                Keep Plus
              </button>
              <button
                onClick={handleCancel}
                disabled={working}
                style={{
                  flex: 1, padding: '14px', borderRadius: 9999,
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgba(239,68,68,0.9)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
                }}>
                {working ? 'Processing…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
