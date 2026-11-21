import { Router } from 'express';
import { z } from 'zod';
import { Scenario } from '../models/Scenario';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const schema = z.object({
  name: z.string().min(1).max(100),
  strategy: z.string(),
  extraPayment: z.number().min(0).optional(),
  loanSnapshot: z.any().optional(),
  results: z.any().optional(),
});

router.get('/scenarios', authMiddleware, async (req, res) => {
  const scenarios = await Scenario.find({ userId: (req as any).user.id }).sort({ createdAt: -1 });
  res.json({ scenarios });
});

router.post('/scenarios', authMiddleware, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const s = await Scenario.create({ ...parsed.data, userId: (req as any).user.id });
  res.status(201).json({ scenario: s });
});

router.delete('/scenarios/:id', authMiddleware, async (req, res) => {
  const s = await Scenario.findOneAndDelete({ _id: req.params.id, userId: (req as any).user.id });
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export const scenarioRouter = router;
