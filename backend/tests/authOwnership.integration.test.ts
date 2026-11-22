import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/server';
import { User } from '../src/models/User';
import { Loan } from '../src/models/Loan';
import { Scenario } from '../src/models/Scenario';
import { RefreshToken } from '../src/models/RefreshToken';
import { EmailVerificationToken, PasswordResetToken } from '../src/models/Token';
import { sendVerificationEmail } from '../src/services/mailer';

jest.mock('../src/models/User', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock('../src/models/Loan', () => ({
  Loan: {
    find: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));
jest.mock('../src/models/Scenario', () => ({
  Scenario: {
    find: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
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
jest.mock('../src/models/Token', () => ({
  EmailVerificationToken: {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
  PasswordResetToken: {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));
jest.mock('../src/services/mailer', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

const ACCESS_SECRET = 'test-access-secret-that-is-long-enough-123456';
process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;

type TestUser = ReturnType<typeof userFixture> & { [key: string]: unknown };
const mocked = (fn: unknown) => fn as jest.Mock;
const users = new Map<string, TestUser>();
const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const otherUserId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const loanId = 'cccccccccccccccccccccccc';
const scenarioId = 'dddddddddddddddddddddddd';
let knownPasswordHash: string;

function authHeader(id: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' = 'USER') {
  const user = users.get(id)!;
  const token = jwt.sign(
    { sub: id, ver: user.sessionVersion, role },
    ACCESS_SECRET,
    { expiresIn: '15m' },
  );
  return { Authorization: `Bearer ${token}` };
}

function selectQuery(value: unknown) {
  return { select: jest.fn().mockResolvedValue(value) };
}

function userFixture(id: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' = 'USER') {
  return {
    _id: id,
    email: `${id}@example.test`,
    passwordHash: '',
    role,
    status: 'active',
    emailVerified: true,
    sessionVersion: 0,
  };
}

beforeAll(async () => {
  knownPasswordHash = await bcrypt.hash('correct horse battery staple', 4);
});

beforeEach(() => {
  jest.clearAllMocks();
  users.clear();
  users.set(userId, { ...userFixture(userId), passwordHash: knownPasswordHash });
  users.set(otherUserId, userFixture(otherUserId));
  mocked(User.findById).mockImplementation((id: unknown) =>
    selectQuery(users.get(String(id)) ?? null),
  );
  mocked(User.findOne).mockResolvedValue(null);
  mocked(User.findByIdAndUpdate).mockImplementation(async (id: unknown, update: Record<string, unknown>) => {
    const user = users.get(String(id));
    if (!user) return null;
    const set = update.$set as Record<string, unknown> | undefined;
    if (set) Object.assign(user, set);
    const increment = update.$inc as Record<string, number> | undefined;
    if (increment) {
      for (const [key, amount] of Object.entries(increment)) {
        user[key] = Number(user[key] ?? 0) + amount;
      }
    }
    return user;
  });
  mocked(User.create).mockImplementation(async (data: Record<string, unknown>) => {
    const created = { ...userFixture('new-user'), ...data, _id: 'new-user' };
    users.set('new-user', created);
    return created;
  });
  mocked(User.deleteOne).mockResolvedValue({ deletedCount: 1 });
  mocked(User.find).mockReturnValue({
    select: () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) }),
  });
  mocked(User.countDocuments).mockResolvedValue(0);
  mocked(Loan.find).mockReturnValue({ sort: () => Promise.resolve([]) });
  mocked(Loan.create).mockResolvedValue({ _id: 'loan-1' });
  mocked(Loan.findOne).mockResolvedValue(null);
  mocked(Loan.findOneAndUpdate).mockResolvedValue(null);
  mocked(Loan.findOneAndDelete).mockResolvedValue(null);
  mocked(Scenario.find).mockReturnValue({ sort: () => Promise.resolve([]) });
  mocked(Scenario.create).mockResolvedValue({ _id: 'scenario-1' });
  mocked(Scenario.findOne).mockResolvedValue(null);
  mocked(Scenario.findOneAndUpdate).mockResolvedValue(null);
  mocked(Scenario.findOneAndDelete).mockResolvedValue(null);
  mocked(RefreshToken.create).mockResolvedValue({});
  mocked(RefreshToken.updateOne).mockResolvedValue({});
  mocked(RefreshToken.updateMany).mockResolvedValue({});
  mocked(RefreshToken.findOneAndUpdate).mockResolvedValue(null);
  mocked(EmailVerificationToken.create).mockResolvedValue({});
  mocked(EmailVerificationToken.findOneAndUpdate).mockResolvedValue(null);
  mocked(EmailVerificationToken.deleteOne).mockResolvedValue({});
  mocked(PasswordResetToken.create).mockResolvedValue({});
  mocked(PasswordResetToken.findOneAndUpdate).mockResolvedValue(null);
  mocked(PasswordResetToken.deleteOne).mockResolvedValue({});
});

describe('Mongo-backed authentication and ownership route contracts', () => {
  it('rejects unauthenticated access to loan records', async () => {
    const response = await request(app).get('/api/v1/loans');
    expect(response.status).toBe(401);
  });

  it('scopes loan reads, edits, and deletes to the authenticated owner', async () => {
    mocked(Loan.find).mockReturnValue({ sort: () => Promise.resolve([{ _id: loanId }]) });
    const list = await request(app).get('/api/v1/loans').set(authHeader(userId));
    expect(list.status).toBe(200);
    expect(Loan.find).toHaveBeenCalledWith({ userId });

    const update = await request(app)
      .put(`/api/v1/loans/${loanId}`)
      .set(authHeader(userId))
      .send({ name: 'Changed' });
    expect(update.status).toBe(404);
    expect(Loan.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: loanId, userId },
      { name: 'Changed' },
      { new: true },
    );

    const remove = await request(app)
      .delete(`/api/v1/loans/${loanId}`)
      .set(authHeader(userId));
    expect(remove.status).toBe(404);
    expect(Loan.findOneAndDelete).toHaveBeenCalledWith({ _id: loanId, userId });
  });

  it('scopes scenario reads, edits, and deletes to the authenticated owner', async () => {
    mocked(Scenario.findOne).mockResolvedValue({ _id: scenarioId, userId });
    const ownRead = await request(app)
      .get(`/api/v1/scenarios/${scenarioId}`)
      .set(authHeader(userId));
    expect(ownRead.status).toBe(200);
    expect(Scenario.findOne).toHaveBeenCalledWith({ _id: scenarioId, userId });

    mocked(Scenario.findOne).mockResolvedValue(null);
    const read = await request(app)
      .get(`/api/v1/scenarios/${scenarioId}`)
      .set(authHeader(userId));
    expect(read.status).toBe(404);
    expect(Scenario.findOne).toHaveBeenCalledWith({
      _id: scenarioId,
      userId,
    });

    const update = await request(app)
      .put(`/api/v1/scenarios/${scenarioId}`)
      .set(authHeader(userId))
      .send({ name: 'Changed' });
    expect(update.status).toBe(404);
    expect(Scenario.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: scenarioId, userId },
      { name: 'Changed' },
      { new: true },
    );

    const remove = await request(app)
      .delete(`/api/v1/scenarios/${scenarioId}`)
      .set(authHeader(userId));
    expect(remove.status).toBe(404);
    expect(Scenario.findOneAndDelete).toHaveBeenCalledWith({
      _id: scenarioId,
      userId,
    });
  });

  it('rejects a stale session token after the user session version changes', async () => {
    users.set(userId, { ...userFixture(userId), sessionVersion: 1 });
    const staleToken = jwt.sign({ sub: userId, ver: 0 }, ACCESS_SECRET, { expiresIn: '15m' });
    const response = await request(app)
      .get('/api/v1/loans')
      .set('Authorization', `Bearer ${staleToken}`);
    expect(response.status).toBe(401);
  });

  it('requires authentication before running repayment comparisons', async () => {
    const response = await request(app)
      .post('/api/v1/repayment/compare')
      .send({ loans: [{ id: 'loan', name: 'Loan', balance: 100, interest_rate: 5, minimum_payment: 10 }] });
    expect(response.status).toBe(401);
  });

  it('requires SUPER_ADMIN for role changes', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${otherUserId}/role`)
      .set(authHeader(userId, 'ADMIN'))
      .send({ role: 'SUPER_ADMIN' });
    expect(response.status).toBe(403);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('allows ADMIN access to user management without granting SUPER_ADMIN operations', async () => {
    users.set(userId, userFixture(userId, 'ADMIN'));
    const list = await request(app)
      .get('/api/v1/admin/users')
      .set(authHeader(userId, 'ADMIN'));
    expect(list.status).toBe(200);

    users.set(userId, userFixture(userId, 'USER'));
    const denied = await request(app)
      .get('/api/v1/admin/users')
      .set(authHeader(userId, 'USER'));
    expect(denied.status).toBe(403);
  });

  it('allows an active SUPER_ADMIN to change a verified account role', async () => {
    users.set(userId, userFixture(userId, 'SUPER_ADMIN'));
    users.set(otherUserId, userFixture(otherUserId));
    mocked(User.findByIdAndUpdate).mockImplementation((_id: unknown, update: Record<string, unknown>) => {
      const set = update.$set as Record<string, unknown>;
      return selectQuery({ ...users.get(otherUserId), ...set });
    });

    const response = await request(app)
      .patch(`/api/v1/admin/users/${otherUserId}/role`)
      .set(authHeader(userId, 'SUPER_ADMIN'))
      .send({ role: 'ADMIN' });
    expect(response.status).toBe(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      otherUserId,
      { $set: { role: 'ADMIN' }, $inc: { sessionVersion: 1 } },
      { new: true },
    );
  });

  it('requires email verification and stores sessions in HTTP-only cookies', async () => {
    const user = users.get(userId)!;
    mocked(User.findOne).mockResolvedValue(user);
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ` ${user.email.toUpperCase()} `, password: 'correct horse battery staple' });
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeUndefined();
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
      ]),
    );
    expect(String(response.headers['set-cookie'])).toContain('HttpOnly');
  });

  it('does not authenticate unverified users', async () => {
    mocked(User.findOne).mockResolvedValue({ ...users.get(userId), emailVerified: false });
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `${userId}@example.test`, password: 'correct horse battery staple' });
    expect(response.status).toBe(401);
  });

  it('rotates refresh tokens and allows logout without a live access token', async () => {
    const user = users.get(userId)!;
    mocked(User.findOne).mockResolvedValue(user);
    const session = request.agent(app);
    const login = await session
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'correct horse battery staple' });
    expect(login.status).toBe(200);

    mocked(RefreshToken.findOneAndUpdate).mockResolvedValue({ userId });
    const refresh = await session.post('/api/v1/auth/refresh');
    expect(refresh.status).toBe(200);
    expect(RefreshToken.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ revoked: false, tokenHash: expect.any(String) }),
      { $set: { revoked: true } },
      { new: false },
    );

    const logout = await session.post('/api/v1/auth/logout');
    expect(logout.status).toBe(204);
    expect(RefreshToken.updateOne).toHaveBeenCalledWith(
      { tokenHash: expect.any(String) },
      { $set: { revoked: true } },
    );
    expect(String(logout.headers['set-cookie'])).toContain('access_token=');
  });

  it('registers without issuing a session and completes email verification', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'NEW@EXAMPLE.TEST', password: 'new secure password', name: 'New User' });
    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeUndefined();
    expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.test' });
    expect(sendVerificationEmail).toHaveBeenCalledWith('new@example.test', expect.any(String));

    mocked(EmailVerificationToken.findOneAndUpdate).mockResolvedValue({ userId: 'new-user' });
    const verification = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'single-use-token' });
    expect(verification.status).toBe(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'new-user',
      { $set: { emailVerified: true } },
      { new: true },
    );
  });

  it('invalidates access and refresh sessions after a password reset', async () => {
    mocked(PasswordResetToken.findOneAndUpdate).mockResolvedValue({ userId });
    const response = await request(app)
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token: 'single-use-reset-token', password: 'a different secure password' });
    expect(response.status).toBe(200);
    const update = mocked(User.findByIdAndUpdate).mock.calls[0][1] as {
      $set: { passwordHash: string };
      $inc: { sessionVersion: number };
    };
    expect(await bcrypt.compare('a different secure password', update.$set.passwordHash)).toBe(true);
    expect(update.$inc.sessionVersion).toBe(1);
    expect(RefreshToken.updateMany).toHaveBeenCalledWith(
      { userId, revoked: false },
      { $set: { revoked: true } },
    );
  });
});
