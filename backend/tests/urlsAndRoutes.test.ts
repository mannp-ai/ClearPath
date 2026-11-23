import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server';
import { requireUrl } from '../src/config/urls';
import { User } from '../src/models/User';
import * as refi from '../src/services/finance/refinancing';

jest.mock('../src/models/User', () => ({ User: { findById: jest.fn() } }));
jest.mock('../src/services/finance/refinancing');

const SECRET = 'test-access-secret-that-is-long-enough-123456';
process.env.JWT_ACCESS_SECRET = SECRET;

describe('requireUrl', () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; });

  it('uses localhost default only outside production', () => {
    delete process.env.FRONTEND_URL;
    process.env.NODE_ENV = 'development';
    expect(requireUrl('FRONTEND_URL', 'http://localhost:3000')).toBe('http://localhost:3000');
  });
  it('fails in production when missing, localhost, or not https', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.FRONTEND_URL;
    expect(() => requireUrl('FRONTEND_URL', 'http://localhost:3000')).toThrow('FRONTEND_URL');
    process.env.FRONTEND_URL = 'https://localhost:3000';
    expect(() => requireUrl('FRONTEND_URL', 'x')).toThrow();
    process.env.FRONTEND_URL = 'http://app.example.com';
    expect(() => requireUrl('FRONTEND_URL', 'x')).toThrow();
    process.env.FRONTEND_URL = 'https://app.example.com';
    expect(requireUrl('FRONTEND_URL', 'x')).toBe('https://app.example.com');
  });
});

describe('refinancing route', () => {
  it('returns 500 (not a hung request) when the calculation throws', async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: () => Promise.resolve({ _id: 'u1', role: 'USER', status: 'active', sessionVersion: 0 }),
    });
    (refi.calculateRefinance as jest.Mock).mockImplementation(() => { throw new Error('boom'); });
    const token = jwt.sign({ sub: 'u1', ver: 0 }, SECRET);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).post('/api/v1/refinancing/calculate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        loans: [{ id: '1', name: 'a', balance: 100, interest_rate: 5, minimum_payment: 10 }],
        proposed_interest_rate: 4, term_months: 60,
      });
    expect(res.status).toBe(500);
  });
  it('requires authentication', async () => {
    expect((await request(app).post('/api/v1/refinancing/calculate').send({})).status).toBe(401);
  });
});
