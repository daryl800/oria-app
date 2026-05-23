import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/i18n';
import App from './App';
import './index.css';
import './styles/theme.css';

// Intercept Supabase email confirmation BEFORE React mounts
// Supabase always redirects to /#access_token=...&type=signup
// If we let React mount, Supabase JS client auto-detects the session
// and App.tsx redirects to /chart. We must intercept here first.
const _h = new URLSearchParams(window.location.hash.slice(1));
if (_h.get('type') === 'signup' && _h.get('access_token')) {
  window.history.replaceState(null, '', '/email-confirmed');
  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:#0D0D14;color:#F0EDE8;font-family:sans-serif;">
      <div style="font-size:64px;margin-bottom:16px;">✅</div>
      <h2 style="font-size:24px;font-weight:700;margin:0 0 12px;color:#F4EFE7;font-family:Georgia,serif;">
        Email Verified!
      </h2>
      <p style="font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;max-width:320px;margin:0 0 16px;">
        Your Oria account has been successfully created and verified.
      </p>
      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:16px;padding:14px 20px;font-size:14px;color:rgba(201,168,76,0.8);line-height:1.6;max-width:320px;margin:0 auto;">
        You can now close this tab and return to where you were signing up to continue.
      </div>
    </div>
  `;
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
