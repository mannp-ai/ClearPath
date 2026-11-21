import Decimal from 'decimal.js';
import { Router } from 'express';
import { z } from 'zod';
import { compareStrategies } from '../services/finance/repayment';

const router = Router();

const loanSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  balance: z.number().positive().max(10000000),
  interest_rate: z.number().min(0).max(100),
  minimum_payment: z.number().positive().max(1000000),
  loan_type: z.string().optional(),
});

const compareSchema = z.object({
  loans: z.array(loanSchema).min(1).max(50),
  extra_monthly_payment: z.number().min(0).max(100000).optional(),
});

router.post('/repayment/compare', (req, res) => {
  const parsed = compareSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { loans, extra_monthly_payment } = parsed.data;
  const result = compareStrategies(loans as any, new Decimal(extra_monthly_payment ?? 0));
  // serialize decimals
  const serialize = (o: any): any => {
    if (o && typeof o === 'object') {
      if (o instanceof (require('decimal.js').default)) return o.toString();
      if (Array.isArray(o)) return o.map(serialize);
      const out: any = {};
      for (const k of Object.keys(o)) out[k] = serialize(o[k]);
      return out;
    }
    return o;
  };
  res.json(serialize(result));
});

export const repaymentRouter = router;
