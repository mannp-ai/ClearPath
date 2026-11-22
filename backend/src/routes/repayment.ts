import Decimal from 'decimal.js';
import { Router } from 'express';
import { z } from 'zod';
import { compareStrategies } from '../services/finance/repayment';
import { authMiddleware } from '../middleware/auth';
import { LoanType } from '../types/finance';
import { serializeDecimalValues } from '../utils/serialize';

const router = Router();

const loanSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  balance: z.number().positive().max(10000000),
  interest_rate: z.number().min(0).max(100),
  minimum_payment: z.number().positive().max(1000000),
  loan_type: z.enum(['Federal', 'Private', 'Unknown']).optional(),
});

const compareSchema = z.object({
  loans: z.array(loanSchema).min(1).max(50),
  extra_monthly_payment: z.number().min(0).max(100000).optional(),
});

router.post('/repayment/compare', authMiddleware, (req, res) => {
  const parsed = compareSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { loans, extra_monthly_payment } = parsed.data;
  const financeLoans = loans.map((loan) => ({
    ...loan,
    loan_type: loan.loan_type === 'Federal'
      ? LoanType.FEDERAL
      : loan.loan_type === 'Private'
        ? LoanType.PRIVATE
        : loan.loan_type === 'Unknown'
          ? LoanType.UNKNOWN
          : undefined,
  }));
  const result = compareStrategies(financeLoans, new Decimal(extra_monthly_payment ?? 0));
  res.json(serializeDecimalValues(result));
});

export const repaymentRouter = router;
