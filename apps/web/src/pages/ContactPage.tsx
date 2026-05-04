import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name || !email || !message) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12,
    padding: '14px 16px', fontSize: 15, color: '#F0EDE8',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, letterSpacing: 1.2,
    color: '#C9A84C', textTransform: 'uppercase',
    display: 'block', marginBottom: 8,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, color: '#C9A84C', margin: '36px 0 10px',
  };

  const bodyText: React.CSSProperties = {
    fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 12,
  };

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>Contact & Feedback</h1>
      <p style={bodyText}>We would love to hear from you.</p>
      <p style={bodyText}>
        Use the form below to send us feedback, report a bug, ask a billing question, or contact us about your account.
      </p>
      <p style={bodyText}>
        You can also email us directly at:{' '}
        <a href="mailto:support@oriacompass.com" style={{ color: '#C9A84C', fontWeight: 700 }}>support@oriacompass.com</a>
      </p>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />

      {/* Form */}
      <h2 style={sectionTitle}>Send us a message</h2>

      {sent ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 20, marginTop: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>Message sent</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            Thank you for reaching out. We will get back to you as soon as possible.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={name} placeholder="Your name" onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} placeholder="your@email.com" onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Subject <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input style={inputStyle} value={subject} placeholder="e.g. Bug report, Feedback, Billing question" onChange={e => setSubject(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
              value={message} placeholder="Tell us what is on your mind..."
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {error && <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={sending} className="oria-btn-primary" style={{ opacity: sending ? 0.6 : 1 }}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '40px 0 0' }} />

      {/* What can you contact us about */}
      <h2 style={sectionTitle}>What can you contact us about?</h2>
      <p style={bodyText}>You can contact us for:</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        {['Bug reports', 'Feedback or suggestions', 'Billing or subscription questions', 'Account support', 'Privacy or data requests', 'General questions about Oria'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      {/* For faster support */}
      <h2 style={sectionTitle}>For faster support</h2>
      <p style={bodyText}>Please include:</p>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        {['The email address linked to your Oria account', 'Which page or feature you were using', 'What happened', 'What you expected to happen', 'Screenshots, if relevant'].map((item, i) => (
          <li key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
        ))}
      </ul>

      {/* Billing */}
      <h2 style={sectionTitle}>Billing or subscription questions</h2>
      <p style={bodyText}>
        For billing, cancellation, or refund questions, please include the email address connected to your Oria account.
      </p>
      <p style={bodyText}>Do not send full credit card details through this form.</p>

      {/* Privacy */}
      <h2 style={sectionTitle}>Privacy or account deletion requests</h2>
      <p style={bodyText}>
        For account deletion or data requests, please use the email address connected to your Oria account so we can verify the request.
      </p>

      {/* Response time */}
      <h2 style={sectionTitle}>Response time</h2>
      <p style={bodyText}>We aim to respond as soon as possible.</p>
      <p style={bodyText}>During busy periods, replies may take longer.</p>
    </div>
  );
}
