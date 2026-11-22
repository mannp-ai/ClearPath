import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import type { Role } from '../models/User';

function accessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be configured with at least 32 characters');
  }
  return secret;
}

export function signAccess(userId: string, sessionVersion: number): string {
  return jwt.sign({ sub: userId, ver: sessionVersion }, accessSecret(), {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ')
    ? header.slice(7)
    : req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });

  let payload: jwt.JwtPayload;
  try {
    const verified = jwt.verify(token, accessSecret(), { algorithms: ['HS256'] });
    if (typeof verified === 'string' || typeof verified.sub !== 'string') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    payload = verified;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return next(error);
  }

  try {
    const user = await User.findById(payload.sub).select('_id role status sessionVersion');
    if (
      !user ||
      user.status !== 'active' ||
      user.sessionVersion !== payload.ver
    ) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = { id: String(user._id), role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
