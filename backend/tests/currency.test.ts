import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/server';
import { User } from '../src/models/User';
import { Loan } from '../src/models/Loan';
import { Scenario } from '../src/models/Scenario';
import {
  countryFromLocale,
  defaultCurrencyForCountry,
  formatMoney,
  portfolioCurrency,
} from '../../frontend/src/lib/currency';

jest.mock('../src/models/User', () => ({
  User: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));

const SECRET = 'test-access-secret-that-is-long-enough-123456';
process.env.JWT_ACCESS_SECRET = SECRET;
const mocked = (fn: unknown) => fn as jest.Mock;
const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const auth = () => ({ Authorization: `Bearer ${jwt.sign({ sub: userId, ver: 0 }, SECRET)}` });
const loan = (currency?: string) => ({
  id: 'l1', name: 'Loan', balance: 1000, interest_rate: 5, minimum_payment: 50, ...(currency ? { currency } : {}),
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  mocked(User.findById).mockReturnValue({
    select: () => Promise.resolve({ _id: userId, role: 'USER', status: 'active', sessionVersion: 0 }),
  });
  mocked(User.findByIdAndUpdate).mockImplementation((_id: unknown, update: { $set: Record<string, string> }) => ({
    select: () => Promise.resolve({ _id: userId, preferences: { country: update.$set['preferences.country'], currency: update.$set['preferences.currency'] } }),
  }));
});

describe('country-based currency defaults', () => {
  it.each([['IN', 'INR'], ['US', 'USD'], ['GB', 'GBP'], ['DE', 'EUR'], ['FR', 'EUR'], ['JP', 'JPY'], ['BR', 'BRL']])(
    '%s -> %s', (country, currency) => expect(defaultCurrencyForCountry(country)).toBe(currency),
  );
  it('falls back to USD for unknown or missing countries', () => {
    expect(defaultCurrencyForCountry('ZZ')).toBe('USD');
    expect(defaultCurrencyForCountry(undefined)).toBe('USD');
  });
  it('derives a country from a browser locale for initial setup only', () => {
    expect(countryFromLocale('en-IN')).toBe('IN');
    expect(countryFromLocale('en-GB')).toBe('GB');
    expect(countryFromLocale('not a locale')).toBeUndefined();
  });
});

describe('preferences persistence and manual override', () => {
  it('stores a currency that differs from the country default', async () => {
    const res = await request(app).patch('/api/v1/auth/preferences').set(auth()).send({ country: 'in', currency: 'usd' });
    expect(res.status).toBe(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      userId, { $set: { 'preferences.country': 'IN', 'preferences.currency': 'USD' } }, { new: true },
    );
    expect(res.body.user.preferences).toEqual({ country: 'IN', currency: 'USD' });
  });
  it('rejects unknown currencies, malformed countries and empty bodies', async () => {
    for (const body of [{ currency: 'ZZZ' }, { currency: 'US' }, { country: 'USA' }, {}]) {
      expect((await request(app).patch('/api/v1/auth/preferences').set(auth()).send(body)).status).toBe(422);
    }
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });
  it('requires authentication', async () => {
    expect((await request(app).patch('/api/v1/auth/preferences').send({ currency: 'INR' })).status).toBe(401);
  });
  it('never touches loans when the preference changes (no conversion)', async () => {
    const spies = [jest.spyOn(Loan, 'updateMany'), jest.spyOn(Loan, 'findOneAndUpdate')];
    await request(app).patch('/api/v1/auth/preferences').set(auth()).send({ currency: 'EUR' });
    spies.forEach((s) => expect(s).not.toHaveBeenCalled());
  });
});

describe('per-loan currency', () => {
  it('defaults legacy and unspecified loans to USD', () => {
    const doc = new Loan({ userId: new mongoose.Types.ObjectId(), name: 'Old', balance: 1, interest_rate: 1, minimum_payment: 1 });
    expect(doc.currency).toBe('USD');
  });
  it('stores the loan currency on create and rejects unsupported ones', async () => {
    const create = jest.spyOn(Loan, 'create').mockResolvedValue({ _id: 'x' } as never);
    const body = { name: 'Rupee loan', type: 'Private', balance: 500000, interest_rate: 9, minimum_payment: 8000, currency: 'INR' };
    expect((await request(app).post('/api/v1/loans').set(auth()).send(body)).status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ currency: 'INR', balance: 500000 }));
    expect((await request(app).post('/api/v1/loans').set(auth()).send({ ...body, currency: 'ZZZ' })).status).toBe(422);
  });
  it('keeps each loan currency in saved scenario snapshots', async () => {
    const create = jest.spyOn(Scenario, 'create').mockResolvedValue({ _id: 's' } as never);
    const snap = [{ name: 'A', type: 'Private', currency: 'INR', balance: 10, interest_rate: 1, minimum_payment: 1 }];
    expect((await request(app).post('/api/v1/scenarios').set(auth()).send({ name: 'S', strategy: 'avalanche', loanSnapshot: snap })).status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ loanSnapshot: snap }));
  });
});

describe('locale-aware formatting (display only)', () => {
  it('uses locale grouping, symbols and decimals', () => {
    expect(formatMoney(1234567.89, 'INR', 'en-IN')).toBe('₹12,34,567.89');
    expect(formatMoney(1234567.89, 'USD', 'en-US')).toBe('$1,234,567.89');
    expect(formatMoney(1234567.89, 'GBP', 'en-GB')).toBe('£1,234,567.89');
    expect(formatMoney(1234.5, 'EUR', 'en-DE')).toContain('€');
  });
  it('changes the symbol but never the amount', () => {
    for (const c of ['USD', 'INR', 'EUR']) expect(formatMoney(100, c, 'en-US')).toContain('100.00');
  });
  it('handles empty values and reports the shared portfolio currency', () => {
    expect(formatMoney(null)).toBe('—');
    expect(portfolioCurrency([])).toBeUndefined();
    expect(portfolioCurrency([{ currency: 'INR' }, { currency: 'INR' }])).toBe('INR');
    expect(portfolioCurrency([{}, { currency: 'USD' }])).toBe('USD');
    expect(portfolioCurrency([{ currency: 'INR' }, {}])).toBe('MIXED');
  });
});

describe('mixed-currency safety', () => {
  const compare = (loans: unknown[]) => request(app).post('/api/v1/repayment/compare').set(auth()).send({ loans });
  const refi = (loans: unknown[]) => request(app).post('/api/v1/refinancing/calculate').set(auth())
    .send({ loans, proposed_interest_rate: 4, term_months: 60 });

  it('refuses repayment and refinancing across currencies, including legacy USD vs explicit INR', async () => {
    for (const loans of [[loan('USD'), loan('INR')], [loan(), loan('INR')]]) {
      expect((await compare(loans)).status).toBe(422);
      expect((await refi(loans)).status).toBe(422);
    }
  });
  it('calculates identically for any single currency (amounts are never converted)', async () => {
    const usd = await compare([loan('USD')]);
    const inr = await compare([loan('INR')]);
    const legacy = await compare([loan()]);
    expect([usd.status, inr.status, legacy.status]).toEqual([200, 200, 200]);
    expect(inr.body).toEqual(usd.body);
    expect(legacy.body).toEqual(usd.body);
    expect((await refi([loan('INR')])).status).toBe(200);
  });
});
