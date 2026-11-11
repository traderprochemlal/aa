import { createSessionToken, passwordIsValid, sessionCookie, isAuthConfigured } from '../lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!isAuthConfigured()) return res.status(503).json({ error: 'Login is not configured yet. Add APP_PASSWORD and SESSION_SECRET in Vercel Environment Variables.' });
  const password = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body).password; } catch { return ''; } })() : req.body?.password;
  if (typeof password !== 'string' || password.length > 512 || !passwordIsValid(password)) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', sessionCookie(createSessionToken()));
  return res.status(200).json({ ok: true });
}
