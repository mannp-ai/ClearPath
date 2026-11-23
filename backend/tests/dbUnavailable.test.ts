import request from 'supertest';
import app from '../src/server';

jest.mock('../src/config/db', () => ({
  connectDB: jest.fn().mockRejectedValue(new Error('down')),
  ensureIndexes: jest.fn(),
}));

describe('database unavailable', () => {
  const env = process.env.NODE_ENV;
  beforeAll(() => { process.env.NODE_ENV = 'production'; });
  afterAll(() => { process.env.NODE_ENV = env; });

  it('returns 503 for db-dependent routes and keeps health up', async () => {
    expect((await request(app).get('/api/v1/loans')).status).toBe(503);
    expect((await request(app).get('/api/health')).status).toBe(200);
  });
});
