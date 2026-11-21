import express from 'express';
import { connectDB } from './config/db';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { adminRouter } from './routes/admin';
import { loanRouter } from './routes/loans';
import { scenarioRouter } from './routes/scenarios';
import { refinancingRouter } from './routes/refinancing';
import { repaymentRouter } from './routes/repayment';

const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','), credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));
app.use('/api/v1', adminRouter);
app.use('/api', adminRouter);
app.use('/api/v1', loanRouter);
app.use('/api', loanRouter);
app.use('/api/v1', scenarioRouter);
app.use('/api/v1', refinancingRouter);
app.use('/api', scenarioRouter);
app.use('/api', refinancingRouter);
app.use('/api', repaymentRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 4000);
if (require.main === module) {
  connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clearpath').then(() => {
    app.listen(port, () => console.log(`ClearPath backend on ${port}`));
  });
}
export default app;
