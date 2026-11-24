import { Router } from 'express';
import { z } from 'zod';
import { Loan } from '../models/Loan';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { isIsoCurrency } from '../utils/currency';

const router = Router();

const loanType = z.enum(['Federal', 'Private', 'Unknown']);
const loanSchema = z.object({
  name: z.string().min(1).max(100),
  type: loanType.default('Unknown'),
  currency: z.string().refine(isIsoCurrency, 'Unsupported currency').optional(),
  balance: z.number().positive().max(10000000),
  interest_rate: z.number().min(0).max(100),
  minimum_payment: z.number().positive().max(1000000),
});
const mongoId = /^[a-f\d]{24}$/i;
// Same ceiling the repayment and refinancing calculators already enforce; stops one account storing unbounded data.
const MAX_LOANS = 50;
const LIMIT_ERROR = { error: `You can store at most ${MAX_LOANS} loans` };

router.get('/loans', authMiddleware, asyncHandler(async (req, res) => {
  const loans = await Loan.find({ userId: req.user!.id }).sort({ createdAt: 1 });
  return res.json({ loans });
}));

router.post('/loans', authMiddleware, asyncHandler(async (req, res) => {
  const parsed = loanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  if (await Loan.countDocuments({ userId: req.user!.id }) >= MAX_LOANS) return res.status(409).json(LIMIT_ERROR);
  const loan = await Loan.create({ ...parsed.data, userId: req.user!.id });
  return res.status(201).json({ loan });
}));

router.put('/loans/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!mongoId.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const parsed = loanSchema.extend({ type: loanType }).partial().safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const loan = await Loan.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, parsed.data, { new: true });
  if (!loan) return res.status(404).json({ error: 'Not found' });
  return res.json({ loan });
}));

router.post('/loans/import', authMiddleware, asyncHandler(async (req, res) => {
  const items = z.array(loanSchema).max(MAX_LOANS).safeParse(req.body?.loans);
  if (!items.success) return res.status(422).json({ error: 'Validation failed', details: items.error.flatten() });
  const created = [];
  for (const l of items.data) {
    const exists = await Loan.findOne({
      userId: req.user!.id,
      name: l.name,
      type: l.type,
      balance: l.balance,
      interest_rate: l.interest_rate,
      minimum_payment: l.minimum_payment,
    });
    if (exists) continue;
    if (await Loan.countDocuments({ userId: req.user!.id }) >= MAX_LOANS) return res.status(409).json(LIMIT_ERROR);
    created.push(await Loan.create({ ...l, userId: req.user!.id }));
  }
  return res.status(201).json({ imported: created.length, loans: created });
}));
router.delete('/loans/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!mongoId.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const loan = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!loan) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true });
}));

export const loanRouter = router;
