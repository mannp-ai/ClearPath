import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { EmailVerificationToken, PasswordResetToken } from '../models/Token';
import {
  hashPassword,
  verifyPassword,
  signAccess,
  authMiddleware,
} from '../middleware/auth';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendSecurityNotification,
} from '../services/mailer';
import {
  generateOAuthState,
  verifyOAuthState,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  verifyGoogleIdToken,
  handleGoogleIdentity,
} from '../services/googleAuth';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { isIsoCurrency } from '../utils/currency';
import { requireUrl } from '../config/urls';

const router = Router();
const ACCESS_TOKEN_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

function asyncHandler(
  handler: (req: import('express').Request, res: import('express').Response) => Promise<unknown>,
) {
  return (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    handler(req, res).catch(next);
  };
}

export function getCookieOptions(maxAge: number) {
  const isProd = process.env.NODE_ENV === 'production';
  const configuredSameSite = (process.env.COOKIE_SAMESITE || (isProd ? 'lax' : 'lax')).toLowerCase();
  const sameSite = (['none', 'lax', 'strict'].includes(configuredSameSite)
    ? configuredSameSite
    : 'lax') as 'none' | 'lax' | 'strict';
  const secure = isProd || sameSite === 'none' || process.env.COOKIE_SECURE === 'true';

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge,
  };
}

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function newToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function issueSession(
  res: import('express').Response,
  user: { _id: unknown; sessionVersion: number },
  refreshToken: string,
) {
  res.cookie('access_token', signAccess(String(user._id), user.sessionVersion), getCookieOptions(ACCESS_TOKEN_MS));
  res.cookie('refresh_token', refreshToken, getCookieOptions(REFRESH_TOKEN_MS));
}

export function clearSession(res: import('express').Response) {
  const options = getCookieOptions(0);
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
}

const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase());

const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

router.post('/auth/register', authLimiter, asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { email, password, name } = parsed.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, role: 'USER', authProvider: 'local', profile: { name } });
  const token = newToken();
  await EmailVerificationToken.create({
    userId: user._id,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  try {
    await sendVerificationEmail(user.email, token);
  } catch (error) {
    console.error('Email verification delivery failed', error);
    await EmailVerificationToken.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    return res.status(503).json({ error: 'Email verification is temporarily unavailable' });
  }
  return res.status(201).json({
    message: 'Check your email to verify your account before signing in.',
    user: { id: user._id, email: user.email, role: user.role },
  });
}));

router.post('/auth/verify-email', authLimiter, asyncHandler(async (req, res) => {
  const parsed = z.object({ token: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed' });
  const verification = await EmailVerificationToken.findOneAndUpdate(
    { tokenHash: tokenHash(parsed.data.token), used: false, expiresAt: { $gt: new Date() } },
    { $set: { used: true } },
    { new: false },
  );
  if (!verification) return res.status(400).json({ error: 'Verification link is invalid or expired' });
  const user = await User.findByIdAndUpdate(
    verification.userId,
    { $set: { emailVerified: true } },
    { new: true },
  );
  if (!user) return res.status(400).json({ error: 'Verification link is invalid or expired' });
  return res.json({ message: 'Email verified. You can now sign in.' });
}));

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });

router.post('/auth/login', authLimiter, asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!user.passwordHash) {
    return res.status(401).json({
      error: 'This account was created with Google sign-in. Please use Continue with Google.',
    });
  }
  if (!user.emailVerified) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const refresh = newToken();
  await RefreshToken.create({
    userId: user._id,
    tokenHash: tokenHash(refresh),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
  });
  issueSession(res, user, refresh);
  return res.json({ user: { id: user._id, email: user.email, role: user.role } });
}));

// ==========================================
// Google OAuth 2.0 / OpenID Connect Endpoints
// ==========================================

router.get('/auth/google', authLimiter, (req, res) => {
  const frontendUrl = requireUrl('FRONTEND_URL', 'http://localhost:3000');
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  const redirect = typeof req.query.redirect === 'string' && req.query.redirect.startsWith('/')
    ? req.query.redirect
    : '/loans';
  const state = generateOAuthState(redirect);
  res.cookie('oauth_state', state, getCookieOptions(15 * 60 * 1000));
  const url = getGoogleAuthUrl(state);
  return res.redirect(url);
});

router.get('/auth/google/callback', authLimiter, asyncHandler(async (req, res) => {
  const frontendUrl = requireUrl('FRONTEND_URL', 'http://localhost:3000');

  // 1. Handle user cancellation or error from Google
  if (req.query.error) {
    const errorParam = req.query.error === 'access_denied' ? 'google_cancelled' : 'google_error';
    return res.redirect(`${frontendUrl}/login?error=${errorParam}`);
  }

  const code = req.query.code;
  const state = req.query.state;

  if (typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect(`${frontendUrl}/login?error=invalid_callback`);
  }

  // 2. Validate state to prevent CSRF
  const verifiedState = verifyOAuthState(state);
  const cookieState = req.cookies?.oauth_state;
  res.clearCookie('oauth_state', getCookieOptions(0));

  if (!verifiedState || !cookieState || cookieState !== state) {
    return res.redirect(`${frontendUrl}/login?error=invalid_state`);
  }

  try {
    // 3. Exchange code for Google ID token
    const tokens = await exchangeCodeForTokens(code);
    const payload = await verifyGoogleIdToken(tokens.id_token);

    // 4. Safely handle/link user
    const { user } = await handleGoogleIdentity(payload);

    // 5. Establish session
    const refresh = newToken();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: tokenHash(refresh),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
    });
    issueSession(res, user, refresh);

    const safeDestination = verifiedState.redirect.startsWith('/') && !verifiedState.redirect.startsWith('//')
      ? verifiedState.redirect
      : '/loans';
    return res.redirect(`${frontendUrl}${safeDestination}`);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err?.message || err);
    return res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
}));

router.post('/auth/google/token', authLimiter, asyncHandler(async (req, res) => {
  const schema = z.object({
    credential: z.string().min(1).optional(),
    idToken: z.string().min(1).optional(),
  }).refine((data) => data.credential || data.idToken, {
    message: 'Either credential or idToken is required',
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const rawToken = parsed.data.credential || parsed.data.idToken!;

  try {
    const payload = await verifyGoogleIdToken(rawToken);
    const { user } = await handleGoogleIdentity(payload);

    const refresh = newToken();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: tokenHash(refresh),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
    });
    issueSession(res, user, refresh);

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (err: any) {
    return res.status(401).json({ error: err?.message || 'Google token verification failed' });
  }
}));

// ==========================================
// Session Refresh, Logout, and Recovery
// ==========================================

// Not rate limited: logged-out page loads call this, and sharing authLimiter would lock people out of login.
router.post('/auth/refresh', asyncHandler(async (req, res) => {
  const refresh = req.cookies?.refresh_token;
  if (!refresh) {
    clearSession(res);
    return res.status(401).json({ error: 'Session expired' });
  }
  const existing = await RefreshToken.findOneAndUpdate(
    { tokenHash: tokenHash(refresh), revoked: false, expiresAt: { $gt: new Date() } },
    { $set: { revoked: true } },
    { new: false },
  );
  if (!existing) {
    clearSession(res);
    return res.status(401).json({ error: 'Session expired' });
  }
  const user = await User.findById(existing.userId)
    .select('_id email role status emailVerified sessionVersion');
  if (!user || user.status !== 'active' || !user.emailVerified) {
    clearSession(res);
    return res.status(401).json({ error: 'Session expired' });
  }
  const nextRefresh = newToken();
  await RefreshToken.create({
    userId: user._id,
    tokenHash: tokenHash(nextRefresh),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
  });
  issueSession(res, user, nextRefresh);
  return res.json({ user: { id: user._id, email: user.email, role: user.role } });
}));

router.post('/auth/logout', asyncHandler(async (req, res) => {
  const refresh = req.cookies?.refresh_token;
  if (refresh) await RefreshToken.updateOne({ tokenHash: tokenHash(refresh) }, { $set: { revoked: true } });
  clearSession(res);
  return res.status(204).end();
}));

router.post('/auth/password-reset/request', authLimiter, asyncHandler(async (req, res) => {
  const parsed = z.object({ email: emailSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed' });
  const user = await User.findOne({ email: parsed.data.email, status: 'active' });
  if (user && user.authProvider === 'local') {
    const token = newToken();
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      console.error('Password reset delivery failed', error);
      await PasswordResetToken.deleteOne({ userId: user._id });
    }
  }
  return res.status(202).json({ message: 'If the account exists, password reset instructions will be sent.' });
}));

router.post('/auth/password-reset/confirm', authLimiter, asyncHandler(async (req, res) => {
  const parsed = z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const reset = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: tokenHash(parsed.data.token), used: false, expiresAt: { $gt: new Date() } },
    { $set: { used: true } },
    { new: false },
  );
  if (!reset) return res.status(400).json({ error: 'Reset link is invalid or expired' });
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await User.findByIdAndUpdate(
    reset.userId,
    { $set: { passwordHash, authProvider: 'local' }, $inc: { sessionVersion: 1 } },
    { new: true },
  );
  if (!user) return res.status(400).json({ error: 'Reset link is invalid or expired' });
  await RefreshToken.updateMany({ userId: user._id, revoked: false }, { $set: { revoked: true } });
  clearSession(res);

  // Send security notification about password change
  try {
    await sendSecurityNotification(
      user.email,
      'Your ClearPath account password was successfully changed. All prior active sessions have been signed out for security.',
    );
  } catch (mailErr) {
    // Non-blocking notification
  }

  return res.json({ message: 'Password updated. Sign in with your new password.' });
}));

router.patch('/auth/preferences', authMiddleware, asyncHandler(async (req, res) => {
  const parsed = z.object({
    country: z.string().toUpperCase().regex(/^[A-Z]{2}$/).optional(),
    currency: z.string().toUpperCase().refine(isIsoCurrency, 'Unsupported currency').optional(),
  }).refine((v) => v.country || v.currency).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed' });
  const set: Record<string, string> = {};
  if (parsed.data.country) set['preferences.country'] = parsed.data.country;
  if (parsed.data.currency) set['preferences.currency'] = parsed.data.currency;
  const user = await User.findByIdAndUpdate(req.user!.id, { $set: set }, { new: true })
    .select('-passwordHash -sessionVersion');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ user });
}));

router.get('/auth/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id).select('-passwordHash -sessionVersion');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ user });
}));

export const authRouter = router;
