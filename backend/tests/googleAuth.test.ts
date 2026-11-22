import request from 'supertest';
import app from '../src/server';
import { User } from '../src/models/User';
import { RefreshToken } from '../src/models/RefreshToken';
import {
  setCustomTokenVerifier,
  generateOAuthState,
  verifyOAuthState,
  GoogleUserPayload,
} from '../src/services/googleAuth';

jest.mock('../src/models/User', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../src/models/RefreshToken', () => ({
  RefreshToken: {
    create: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

const mocked = (fn: unknown) => fn as jest.Mock;
process.env.JWT_ACCESS_SECRET = 'test-secret-at-least-32-characters-long-12345';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:4000/api/v1/auth/google/callback';
process.env.FRONTEND_URL = 'http://localhost:3000';

describe('Google OAuth 2.0 / OpenID Connect Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCustomTokenVerifier(null);
  });

  it('redirects to Google OAuth consent page with state cookie', async () => {
    const res = await request(app).get('/api/v1/auth/google?redirect=/repayment');
    expect(res.status).toBe(302);
    expect(res.header.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(res.header.location).toContain('client_id=test-google-client-id.apps.googleusercontent.com');
    expect(res.header.location).toContain('response_type=code');
    expect(res.header.location).toContain('scope=openid+email+profile');
    expect(res.header['set-cookie']).toBeDefined();
    expect(String(res.header['set-cookie'])).toContain('oauth_state=');
  });

  it('handles user cancellation gracefully', async () => {
    const res = await request(app)
      .get('/api/v1/auth/google/callback?error=access_denied')
      .expect(302);
    expect(res.header.location).toBe('http://localhost:3000/login?error=google_cancelled');
  });

  it('rejects callback with invalid or tampered OAuth state', async () => {
    const res = await request(app)
      .get('/api/v1/auth/google/callback?code=mock-code&state=invalid-state')
      .set('Cookie', ['oauth_state=different-state'])
      .expect(302);
    expect(res.header.location).toBe('http://localhost:3000/login?error=invalid_state');
  });

  it('verifies state integrity and expiration', () => {
    const state = generateOAuthState('/repayment');
    const verified = verifyOAuthState(state);
    expect(verified).not.toBeNull();
    expect(verified?.redirect).toBe('/repayment');

    const tampered = state.slice(0, -4) + 'abcd';
    expect(verifyOAuthState(tampered)).toBeNull();
  });

  it('authenticates via POST /auth/google/token and creates a new user', async () => {
    const googlePayload: GoogleUserPayload = {
      sub: 'google-sub-12345',
      email: 'alex@example.com',
      email_verified: true,
      name: 'Alex Smith',
      picture: 'https://example.com/avatar.jpg',
    };

    setCustomTokenVerifier(async () => googlePayload);

    // Mock: no user found by googleId or email
    mocked(User.findOne).mockResolvedValue(null);
    const mockCreatedUser = {
      _id: 'new-google-user-id',
      email: 'alex@example.com',
      googleId: 'google-sub-12345',
      authProvider: 'google',
      role: 'USER',
      status: 'active',
      emailVerified: true,
      sessionVersion: 0,
      profile: { name: 'Alex Smith', picture: 'https://example.com/avatar.jpg' },
    };
    mocked(User.create).mockResolvedValue(mockCreatedUser);
    mocked(RefreshToken.create).mockResolvedValue({});

    const res = await request(app)
      .post('/api/v1/auth/google/token')
      .send({ idToken: 'valid-google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: 'new-google-user-id',
      email: 'alex@example.com',
      role: 'USER',
      profile: { name: 'Alex Smith', picture: 'https://example.com/avatar.jpg' },
    });
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
      ]),
    );
    expect(String(res.headers['set-cookie'])).toContain('HttpOnly');
  });

  it('safely links existing email-verified user upon Google sign-in', async () => {
    const googlePayload: GoogleUserPayload = {
      sub: 'google-sub-67890',
      email: 'existing@example.com',
      email_verified: true,
      name: 'Existing User',
    };
    setCustomTokenVerifier(async () => googlePayload);

    // 1st lookup by googleId returns null, 2nd by email returns existing user
    const existingUser = {
      _id: 'existing-user-id',
      email: 'existing@example.com',
      role: 'USER',
      status: 'active',
      emailVerified: true,
      sessionVersion: 0,
      profile: {},
      save: jest.fn().mockResolvedValue(true),
    };

    mocked(User.findOne)
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce(existingUser); // by email

    mocked(RefreshToken.create).mockResolvedValue({});

    const res = await request(app)
      .post('/api/v1/auth/google/token')
      .send({ credential: 'valid-google-credential' });

    expect(res.status).toBe(200);
    expect(existingUser.save).toHaveBeenCalled();
    expect((existingUser as any).googleId).toBe('google-sub-67890');
    expect(res.body.user.email).toBe('existing@example.com');
  });

  it('rejects Google authentication when Google email is unverified', async () => {
    setCustomTokenVerifier(async () => ({
      sub: 'google-sub-unverified',
      email: 'unverified@example.com',
      email_verified: false,
    }));

    const res = await request(app)
      .post('/api/v1/auth/google/token')
      .send({ credential: 'unverified-google-token' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('unverified');
  });

  it('informs Google-only users to sign in with Google when attempting password login', async () => {
    const googleUser = {
      _id: 'google-user-id',
      email: 'google-only@example.com',
      passwordHash: undefined,
      authProvider: 'google',
      status: 'active',
      emailVerified: true,
    };
    mocked(User.findOne).mockResolvedValue(googleUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'google-only@example.com', password: 'SomePassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Continue with Google');
  });
});
