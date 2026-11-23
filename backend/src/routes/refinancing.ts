import { Router } from 'express';
import { z } from 'zod';
import { calculateRefinance } from '../services/finance/refinancing';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { serializeDecimalValues } from '../utils/serialize';
import { isIsoCurrency, mixedCurrencies, MIXED_CURRENCY_ERROR } from '../utils/currency';
import { LoanType, type LoanInput } from '../types/finance';

const router = Router();

const refiSchema = z.object({
  loans: z.array(z.object({
    id: z.string(), name: z.string(), balance: z.number().positive(), interest_rate: z.number().min(0).max(100), minimum_payment: z.number().positive(), loan_type: z.enum(['Federal', 'Private', 'Unknown']).optional(), type: z.enum(['Federal', 'Private', 'Unknown']).optional(), currency: z.string().refine(isIsoCurrency, 'Unsupported currency').optional(),
  })).min(1).max(50),
  proposed_interest_rate: z.number().min(0).max(100),
  term_months: z.number().int().positive().max(600),
  fees: z.number().min(0).max(500000).default(0),
  fee_treatment: z.enum(['upfront', 'financed']).default('upfront'),
  has_federal_loans: z.boolean().optional(),
});

router.post('/refinancing/calculate', authMiddleware, asyncHandler(async (req, res) => {
  const parsed = refiSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { loans, ...rest } = parsed.data;
  if (mixedCurrencies(loans)) return res.status(422).json({ error: MIXED_CURRENCY_ERROR });
  const financeLoans: LoanInput[] = loans.map((loan) => ({
    ...loan,
    loan_type: loan.loan_type === 'Federal' || loan.type === 'Federal'
      ? LoanType.FEDERAL
      : loan.loan_type === 'Private' || loan.type === 'Private'
        ? LoanType.PRIVATE
        : loan.loan_type === 'Unknown' || loan.type === 'Unknown'
          ? LoanType.UNKNOWN
          : undefined,
  }));
  const result = calculateRefinance(financeLoans, rest);
  res.json(serializeDecimalValues(result));
}));

export const refinancingRouter = router;
