import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ContactPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const contactAboutItems = t('footerPages.contact.contactAboutItems', { returnObjects: true }) as string[];
  const fasterItems = t('footerPages.contact.fasterItems', { returnObjects: true }) as string[];

  async function handleSubmit() {
    if (!name || !email || !message) { setError(t('footerPages.contact.validationError')); return; }
    setSending(true); setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('footerPages.contact.failedToSend'));
      setSent(true);
    } catch (err: any) { setError(err.message); }
    finally { setSending(false); }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: '#F0EDE8', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#C9A84C', textTransform: 'uppercase', display: 'block', marginBottom: 8 };
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '36px 0 10px' };
  const p: React.CSSProperties = { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12 };

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '24px 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
        {t('common.back')}
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>{t('footerPages.contact.title')}</h1>
      <p style={p}>{t('footerPages.contact.intro1')}</p>
      <p style={p}>{t('footerPages.contact.intro2')}</p>
      <p style={p}>{t('footerPages.contact.intro3')}{' '}<a href="mailto:support@oriacompass.com" style={{ color: '#C9A84C', fontWeight: 700 }}>support@oriacompass.com</a></p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />
      <h2 style={h2}>{t('footerPages.contact.formTitle')}</h2>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20, marginTop: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>{t('footerPages.contact.successTitle')}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{t('footerPages.contact.successBody')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('footerPages.contact.labels.name')}</label>
              <input style={inputStyle} value={name} placeholder={t('footerPages.contact.placeholders.name')} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>{t('footerPages.contact.labels.email')}</label>
              <input style={inputStyle} type="email" value={email} placeholder={t('footerPages.contact.placeholders.email')} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('footerPages.contact.labels.subject')}{' '}<span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({t('footerPages.contact.labels.optional')})</span></label>
            <input style={inputStyle} value={subject} placeholder={t('footerPages.contact.placeholders.subject')} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{t('footerPages.contact.labels.message')}</label>
            <textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} value={message} placeholder={t('footerPages.contact.placeholders.message')} onChange={e => setMessage(e.target.value)} />
          </div>
          {error && <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>{error}</p>}
          <button onClick={handleSubmit} disabled={sending} className="oria-btn-primary" style={{ opacity: sending ? 0.6 : 1 }}>
            {sending ? t('footerPages.contact.sending') : t('footerPages.contact.send')}
          </button>
        </div>
      )}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '40px 0 0' }} />
      <h2 style={h2}>{t('footerPages.contact.contactAboutTitle')}</h2>
      <p style={p}>{t('footerPages.contact.contactAboutIntro')}</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        {contactAboutItems.map((item, i) => <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>)}
      </ul>
      <h2 style={h2}>{t('footerPages.contact.fasterTitle')}</h2>
      <p style={p}>{t('footerPages.contact.fasterIntro')}</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        {fasterItems.map((item, i) => <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>)}
      </ul>
      <h2 style={h2}>{t('footerPages.contact.billingTitle')}</h2>
      <p style={p}>{t('footerPages.contact.billingP1')}</p>
      <p style={p}>{t('footerPages.contact.billingP2')}</p>
      <h2 style={h2}>{t('footerPages.contact.privacyTitle')}</h2>
      <p style={p}>{t('footerPages.contact.privacyP1')}</p>
      <h2 style={h2}>{t('footerPages.contact.responseTitle')}</h2>
      <p style={p}>{t('footerPages.contact.responseP1')}</p>
      <p style={p}>{t('footerPages.contact.responseP2')}</p>
    </div>
  );
}
