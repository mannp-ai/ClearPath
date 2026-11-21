import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { repaymentRouter } from './routes/repayment';

const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','), credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));
app.use('/api/v1', repaymentRouter);
app.use('/api', repaymentRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`ClearPath backend on ${port}`));
export default app;
