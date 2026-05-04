import { Router, Request, Response } from 'express';

const contactRouter = Router();

contactRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const apiKey = process.env.ORIA_CONTACT_FORM;
    if (!apiKey) throw new Error('Brevo API key not configured');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Oria Contact Form', email: 'support@oriacompass.com' },
        to: [{ email: 'support@oriacompass.com', name: 'Oria Support' }],
        replyTo: { email, name },
        subject: subject ? `[Oria Contact] ${subject}` : `[Oria Contact] Message from ${name}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C9A84C;">New message from Oria Contact Form</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; color: #555;">Name</td><td style="padding: 8px;">${name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
              ${subject ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">Subject</td><td style="padding: 8px;">${subject}</td></tr>` : ''}
            </table>
            <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
              <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Message</p>
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(JSON.stringify(err));
    }

    return res.json({ success: true });
python3 << 'EOF'
path = '/Users/daryl/develop/oria-app/apps/api/src/routes/apiRouter.ts'
with open(path, 'r') as f:
    content = f.read()

old = "import { authMiddleware } from '../middleware/auth';"
new = "import { authMiddleware } from '../middleware/auth';\nimport contactRouter from './contact';"

old_routes = "// oria routes (auth protected)"
new_routes = "// public contact form\napiRouter.use('/public/contact', contactRouter);\n\n// oria routes (auth protected)"

if old in content:
    content = content.replace(old, new)
    print('Import added')
else:
    print('Import pattern not found')

if old_routes in content:
    content = content.replace(old_routes, new_routes)
    print('Route registered')
else:
    print('Route pattern not found')

with open(path, 'w') as f:
    f.write(content)
EOF
cat > /Users/daryl/develop/oria-app/apps/web/src/pages/ContactPage.tsx << 'ENDOFFILE'
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

  return (
    <div className="oria-page oria-container animate-fade-in" style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: 14, padding: '24px 0 16px',
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
      }}>← Back</button>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>Contact & Feedback</h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 24, lineHeight: 1.7 }}>
        We would love to hear from you. Fill in the form below or email us directly at{' '}
        <a href="mailto:support@oriacompass.com" style={{ color: '#C9A84C' }}>support@oriacompass.com</a>
      </p>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 32 }} />

      {sent ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>Message sent</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            Thank you for reaching out. We will get back to you as soon as possible.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle} value={name} placeholder="Your name"
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle} type="email" value={email} placeholder="your@email.com"
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Subject <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input
              style={inputStyle} value={subject} placeholder="e.g. Bug report, Feedback, Billing question"
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
              value={message} placeholder="Tell us what's on your mind..."
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={sending}
            className="oria-btn-primary"
            style={{ opacity: sending ? 0.6 : 1 }}
          >
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </div>
      )}
    </div>
  );
}
