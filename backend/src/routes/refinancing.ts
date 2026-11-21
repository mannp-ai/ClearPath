import { Router } from 'express';
import { z } from 'zod';
import { calculateRefinance } from '../services/finance/refinancing';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const refiSchema = z.object({
  loans: z.array(z.object({
    id: z.string(), name: z.string(), balance: z.number().positive(), interest_rate: z.number().min(0).max(100), minimum_payment: z.number().positive(), loan_type: z.string().optional(), type: z.string().optional(),
  })).min(1),
  proposed_interest_rate: z.number().min(0).max(100),
  term_months: z.number().int().positive().max(600),
  fees: z.number().min(0).max(500000).default(0),
  fee_treatment: z.enum(['upfront', 'financed']).default('upfront'),
  has_federal_loans: z.boolean().optional(),
});

router.post('/refinancing/calculate', authMiddleware, async (req, res) => {
  const parsed = refiSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { loans, ...rest } = parsed.data;
  const result = calculateRefinance(loans as any, rest as any);
  const serialize = (o: any): any => {
    if (o && typeof o === 'object') {
      if (o instanceof (require('decimal.js').default)) return o.toString();
      if (Array.isArray(o)) return o.map(serialize);
      const out: any = {}; for (const k of Object.keys(o)) out[k] = serialize(o[k]); return out;
    }
    return o;
  };
  res.json(serialize(result));
});

export const refinancingRouter = router;
