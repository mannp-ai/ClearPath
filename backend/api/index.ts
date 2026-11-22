import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server';
import { connectDB } from '../src/config/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.MONGODB_URI) {
    await connectDB();
  }
  return app(req as any, res as any);
}
