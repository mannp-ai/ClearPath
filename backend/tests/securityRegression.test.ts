import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/server';
import { User } from '../src/models/User';
import { Loan } from '../src/models/Loan';

jest.mock('../src/models/User', () => ({ User: { findOne: jest.fn(), findById: jest.fn() } }));
jest.mock('../src/models/Loan', () => ({ Loan: { create: jest.fn(), findOne: jest.fn(), countDocuments: jest.fn() } }));
jest.mock('../src/models/RefreshToken', () => ({ RefreshToken: { create: jest.fn() } }));

const SECRET = 'test-access-secret-that-is-long-enough-123456';
process.env.JWT_ACCESS_SECRET = SECRET;
const mocked = (fn: unknown) => fn as jest.Mock;
const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const cookie = `access_token=${jwt.sign({ sub: userId, ver: 0 }, SECRET, { algorithm: 'HS256', expiresIn: '5m' })}`;
const loan = { name: 'L', type: 'Federal', balance: 100, interest_rate: 1, minimum_payment: 10 };

beforeEach(() => {
  jest.clearAllMocks();
  mocked(User.findById).mockReturnValue({
    select: async () => ({ _id: userId, role: 'USER', status: 'active', sessionVersion: 0 }),
  });
  mocked(Loan.findOne).mockResolvedValue(null);
  mocked(Loan.create).mockResolvedValue({ _id: 'l1' });
});

describe('security regressions', () => {
  it('rejects an import larger than the 50-loan ceiling without touching the database', async () => {
    const res = await request(app).post('/api/v1/loans/import').set('Cookie', cookie)
      .send({ loans: Array.from({ length: 51 }, (_, i) => ({ ...loan, name: `L${i}` })) });
    expect(res.status).toBe(422);
    expect(Loan.create).not.toHaveBeenCalled();
  });

  it('refuses to create or import loans once the account holds 50', async () => {
    mocked(Loan.countDocuments).mockResolvedValue(50);
    const created = await request(app).post('/api/v1/loans').set('Cookie', cookie).send(loan);
    const imported = await request(app).post('/api/v1/loans/import').set('Cookie', cookie).send({ loans: [loan] });
    expect(created.status).toBe(409);
    expect(imported.status).toBe(409);
    expect(Loan.create).not.toHaveBeenCalled();
  });

  it('still creates a loan below the ceiling', async () => {
    mocked(Loan.countDocuments).mockResolvedValue(49);
    const res = await request(app).post('/api/v1/loans').set('Cookie', cookie).send(loan);
    expect(res.status).toBe(201);
  });

  it('runs a bcrypt compare for unknown emails so login timing does not reveal registered accounts', async () => {
    mocked(User.findOne).mockResolvedValue(null);
    const compare = jest.spyOn(bcrypt, 'compare');
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: 'whatever-123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
    expect(compare).toHaveBeenCalledTimes(1);
    compare.mockRestore();
  });

  it('answers malformed JSON with 400, not a server error', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });

  it('answers an oversized body with 413, not a server error', async () => {
    const res = await request(app).post('/api/v1/loans').set('Cookie', cookie)
      .set('Content-Type', 'application/json').send(JSON.stringify({ pad: 'x'.repeat(1_100_000) }));
    expect(res.status).toBe(413);
  });
});
