import crypto from 'crypto';
import { requireUrl } from '../config/urls';
import { User, IUser } from '../models/User';

export interface GoogleUserPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export function getGoogleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) {
    throw new Error('GOOGLE_CLIENT_ID must be configured');
  }
  return id;
}

export function getGoogleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) {
    throw new Error('GOOGLE_CLIENT_SECRET must be configured');
  }
  return secret;
}

export function getGoogleCallbackUrl(): string {
  return requireUrl('GOOGLE_CALLBACK_URL', 'http://localhost:4000/api/v1/auth/google/callback');
}

export function generateOAuthState(redirectPath?: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ nonce, redirect: redirectPath || '/loans', ts: Date.now() });
  const secret = process.env.JWT_ACCESS_SECRET!;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyOAuthState(state: string): { redirect: string } | null {
  try {
    const raw = Buffer.from(state, 'base64url').toString('utf8');
    const parts = raw.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const secret = process.env.JWT_ACCESS_SECRET!;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    const data = JSON.parse(payload);
    // State expires after 15 minutes
    if (Date.now() - data.ts > 15 * 60 * 1000) {
      return null;
    }
    return { redirect: data.redirect || '/loans' };
  } catch {
    return null;
  }
}

export function getGoogleAuthUrl(state: string, redirectUri?: string): string {
  const clientId = getGoogleClientId();
  const callback = redirectUri || getGoogleCallbackUrl();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state,
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri?: string,
): Promise<{ id_token: string; access_token: string }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const callback = redirectUri || getGoogleCallbackUrl();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callback,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { id_token?: string; access_token?: string };
  if (!data.id_token) {
    throw new Error('Google token response did not contain an id_token');
  }

  return { id_token: data.id_token, access_token: data.access_token || '' };
}

// Custom verifier hook for testing/mocking
let customTokenVerifier: ((token: string) => Promise<GoogleUserPayload>) | null = null;

export function setCustomTokenVerifier(verifier: ((token: string) => Promise<GoogleUserPayload>) | null) {
  customTokenVerifier = verifier;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserPayload> {
  if (customTokenVerifier) {
    return customTokenVerifier(idToken);
  }

  const clientId = getGoogleClientId();

  // Verify against Google tokeninfo endpoint
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Invalid Google ID token (${response.status})`);
  }

  const data = (await response.json()) as {
    aud?: string;
    iss?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
    exp?: string | number;
  };

  // Validate audience
  if (data.aud !== clientId) {
    throw new Error(`Google token audience mismatch: expected ${clientId}, got ${data.aud}`);
  }

  // Validate issuer
  if (data.iss !== 'https://accounts.google.com' && data.iss !== 'accounts.google.com') {
    throw new Error(`Invalid Google token issuer: ${data.iss}`);
  }

  // Validate expiry
  const now = Math.floor(Date.now() / 1000);
  const exp = Number(data.exp);
  if (!exp || exp < now) {
    throw new Error('Google token has expired');
  }

  // Validate subject & email
  if (!data.sub || !data.email) {
    throw new Error('Google token missing required subject or email claim');
  }

  // Validate verified email
  const isVerified = data.email_verified === true || data.email_verified === 'true';
  if (!isVerified) {
    throw new Error('Google account email is not verified');
  }

  return {
    sub: data.sub,
    email: data.email.toLowerCase().trim(),
    email_verified: isVerified,
    name: data.name,
    picture: data.picture,
  };
}

export async function handleGoogleIdentity(
  payload: GoogleUserPayload,
): Promise<{ user: IUser; isNew: boolean }> {
  if (!payload.email_verified) {
    throw new Error('Cannot authenticate with unverified Google email');
  }

  const normalizedEmail = payload.email.toLowerCase().trim();

  // 1. Search by verified Google subject ID
  const existingByGoogleId = await User.findOne({ googleId: payload.sub });
  if (existingByGoogleId) {
    if (existingByGoogleId.status !== 'active') {
      throw new Error('This account has been deactivated');
    }
    // Update profile image/name if changed
    let updated = false;
    if (payload.picture && existingByGoogleId.profile?.picture !== payload.picture) {
      existingByGoogleId.profile = { ...existingByGoogleId.profile, picture: payload.picture };
      updated = true;
    }
    if (payload.name && !existingByGoogleId.profile?.name) {
      existingByGoogleId.profile = { ...existingByGoogleId.profile, name: payload.name };
      updated = true;
    }
    if (updated) {
      await existingByGoogleId.save();
    }
    return { user: existingByGoogleId, isNew: false };
  }

  // 2. Search by verified email for safe account linking
  const existingByEmail = await User.findOne({ email: normalizedEmail });
  if (existingByEmail) {
    if (existingByEmail.status !== 'active') {
      throw new Error('This account has been deactivated');
    }
    // Safe linking: Google has verified email ownership
    existingByEmail.googleId = payload.sub;
    // An unverified local account may have been pre-registered by someone else: drop its password.
    if (!existingByEmail.emailVerified) existingByEmail.passwordHash = undefined;
    existingByEmail.emailVerified = true;
    if (payload.name && !existingByEmail.profile?.name) {
      existingByEmail.profile = { ...existingByEmail.profile, name: payload.name };
    }
    if (payload.picture && !existingByEmail.profile?.picture) {
      existingByEmail.profile = { ...existingByEmail.profile, picture: payload.picture };
    }
    await existingByEmail.save();
    return { user: existingByEmail, isNew: false };
  }

  // 3. Create a new user record
  try {
    const newUser = await User.create({
      email: normalizedEmail,
      googleId: payload.sub,
      authProvider: 'google',
      role: 'USER',
      status: 'active',
      emailVerified: true,
      sessionVersion: 0,
      profile: {
        name: payload.name,
        picture: payload.picture,
      },
    });
    return { user: newUser, isNew: true };
  } catch (err: any) {
    // Concurrent first sign-ins: the unique index rejected the duplicate; reuse the winner (same Google subject only).
    if (err?.code === 11000) {
      const winner = await User.findOne({ googleId: payload.sub });
      if (winner && winner.status === 'active') return { user: winner, isNew: false };
    }
    throw err;
  }
}
