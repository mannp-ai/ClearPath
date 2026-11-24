import 'dotenv/config';
import express from 'express';
import { connectDB, ensureIndexes } from './config/db';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { loanRouter } from './routes/loans';
import { scenarioRouter } from './routes/scenarios';
import { refinancingRouter } from './routes/refinancing';
import { repaymentRouter } from './routes/repayment';

const app = express();
// Behind Render/Vercel's proxy every request would otherwise share the proxy IP, so the auth rate limit
// would lock out all users together (and express-rate-limit logs ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
// TRUST_PROXY_HOPS=2 when the Vercel rewrite proxy sits in front of Render (client -> Vercel -> Render).
if (process.env.NODE_ENV === 'production') app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
app.use(helmet());

const corsOrigins = (process.env.CORS_ORIGINS || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or requests without Origin header (e.g. mobile/curl)
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow preview deployments if configured
    if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// Serverless DB connection middleware (reuses the cached connection; 503 if unavailable)
app.use(async (_req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try {
    await connectDB();
    return next();
  } catch (err) {
    console.error('Database unavailable', err);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});
app.use('/api/v1', authRouter);
app.use('/api', authRouter);
app.use('/api/v1', adminRouter);
app.use('/api', adminRouter);
app.use('/api/v1', loanRouter);
app.use('/api', loanRouter);
app.use('/api/v1', scenarioRouter);
app.use('/api/v1', refinancingRouter);
app.use('/api/v1', repaymentRouter);
app.use('/api', scenarioRouter);
app.use('/api', refinancingRouter);
app.use('/api', repaymentRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.message?.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 4000);
if (require.main === module) {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be configured with at least 32 characters');
  }
  if (!process.env.CORS_ORIGINS && process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS must be configured in production');
  }
  connectDB().then(async () => {
    await ensureIndexes();
    app.listen(port, () => console.log(`ClearPath backend on ${port}`));
  }).catch(() => process.exit(1));
}

export default app;
