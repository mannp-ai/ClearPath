import { Router } from 'express';
import { z } from 'zod';
import { Loan } from '../models/Loan';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const loanSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['Federal', 'Private', 'Unknown']).default('Unknown'),
  balance: z.number().positive().max(10000000),
  interest_rate: z.number().min(0).max(100),
  minimum_payment: z.number().positive().max(1000000),
});

router.get('/loans', authMiddleware, async (req, res) => {
  const loans = await Loan.find({ userId: (req as any).user.id }).sort({ createdAt: 1 });
  res.json({ loans });
});

router.post('/loans', authMiddleware, async (req, res) => {
  const parsed = loanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const loan = await Loan.create({ ...parsed.data, userId: (req as any).user.id });
  res.status(201).json({ loan });
});

router.put('/loans/:id', authMiddleware, async (req, res) => {
  const parsed = loanSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const loan = await Loan.findOneAndUpdate({ _id: req.params.id, userId: (req as any).user.id }, parsed.data, { new: true });
  if (!loan) return res.status(404).json({ error: 'Not found' });
  res.json({ loan });
});

router.delete('/loans/:id', authMiddleware, async (req, res) => {
  const loan = await Loan.findOneAndDelete({ _id: req.params.id, userId: (req as any).user.id });
  if (!loan) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export const loanRouter = router;
