import { Router } from 'express';
import { User } from '../models/User';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/admin/users', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (_req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(100);
  res.json({ users, total: await User.countDocuments() });
});

router.patch('/admin/users/:id/status', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const { status } = req.body;
  if (!['active', 'deactivated'].includes(status)) return res.status(422).json({ error: 'Invalid status' });
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user });
});

export const adminRouter = router;
