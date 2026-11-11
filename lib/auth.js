import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'chemlal_session';
const SESSION_SECONDS = 60 * 60 * 12;

function configReady() {
  return Boolean(process.env.APP_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}

function signature(value) {
  return createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('base64url');
}

export function passwordIsValid(candidate) {
  const expected = createHash('sha256').update(process.env.APP_PASSWORD || '').digest();
  const received = createHash('sha256').update(String(candidate || '')).digest();
  return timingSafeEqual(expected, received) && Boolean(process.env.APP_PASSWORD);
}

export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return payload + '.' + signature(payload);
}

export function hasValidSession(req) {
  if (!configReady()) return false;
  const header = req.headers.cookie || '';
  const match = header.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + '='));
  if (!match) return false;
  const token = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const expected = Buffer.from(signature(parts[0]));
  const actual = Buffer.from(parts[1]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return Number.isFinite(payload.exp) && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sessionCookie(token, maxAge = SESSION_SECONDS) {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function isAuthConfigured() {
  return configReady();
}
