import { Router } from 'express';
import { z } from 'zod';
import { Scenario } from '../models/Scenario';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { isIsoCurrency } from '../utils/currency';

const router = Router();

const schema = z.object({
  name: z.string().min(1).max(100),
  strategy: z.enum(['baseline', 'avalanche', 'snowball']),
  extraPayment: z.number().min(0).max(100000).optional(),
  loanSnapshot: z.array(z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['Federal', 'Private', 'Unknown']),
    currency: z.string().refine(isIsoCurrency, 'Unsupported currency').optional(),
    balance: z.number().positive().max(10000000),
    interest_rate: z.number().min(0).max(100),
    minimum_payment: z.number().positive().max(1000000),
  })).max(50).optional(),
  results: z.record(z.string(), z.unknown()).optional(),
});
const updateSchema = schema.partial().refine((value) => Object.keys(value).length > 0);
const mongoId = /^[a-f\d]{24}$/i;

router.get('/scenarios', authMiddleware, asyncHandler(async (req, res) => {
  const scenarios = await Scenario.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  return res.json({ scenarios });
}));

router.get('/scenarios/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!mongoId.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const scenario = await Scenario.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!scenario) return res.status(404).json({ error: 'Not found' });
  return res.json({ scenario });
}));

router.post('/scenarios', authMiddleware, asyncHandler(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const scenario = await Scenario.create({ ...parsed.data, userId: req.user!.id });
  return res.status(201).json({ scenario });
}));

router.put('/scenarios/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!mongoId.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const scenario = await Scenario.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    parsed.data,
    { new: true },
  );
  if (!scenario) return res.status(404).json({ error: 'Not found' });
  return res.json({ scenario });
}));

router.delete('/scenarios/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!mongoId.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const scenario = await Scenario.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!scenario) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true });
}));

export const scenarioRouter = router;
