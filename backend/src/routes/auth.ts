import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { hashPassword, verifyPassword, signAccess, authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

router.post('/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { email, password, name } = parsed.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, role: 'USER', profile: { name } });
  const access = signAccess(String(user._id), user.role);
  res.status(201).json({ user: { id: user._id, email: user.email, role: user.role }, accessToken: access });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const access = signAccess(String(user._id), user.role);
  const refresh = crypto.randomBytes(48).toString('hex');
  const hash = crypto.createHash('sha256').update(refresh).digest('hex');
  await RefreshToken.create({ userId: user._id, tokenHash: hash, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) });
  res.cookie('refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 3600 * 1000 });
  res.json({ user: { id: user._id, email: user.email, role: user.role }, accessToken: access });
});

router.post('/auth/logout', authMiddleware, async (req, res) => {
  const refresh = req.cookies?.refresh_token;
  if (refresh) {
    const hash = crypto.createHash('sha256').update(refresh).digest('hex');
    await RefreshToken.updateOne({ tokenHash: hash }, { revoked: true });
  }
  res.clearCookie('refresh_token');
  res.json({ ok: true });
});

router.get('/auth/me', authMiddleware, async (req, res) => {
  const user = await User.findById((req as any).user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user });
});

export const authRouter = router;
