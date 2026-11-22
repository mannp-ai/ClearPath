import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const mongoId = /^[a-f\d]{24}$/i;

function asyncHandler(
  handler: (req: import('express').Request, res: import('express').Response) => Promise<unknown>,
) {
  return (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    handler(req, res).catch(next);
  };
}

router.get('/admin/users', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (_req, res) => {
  const users = await User.find().select('-passwordHash -sessionVersion').sort({ createdAt: -1 }).limit(100);
  return res.json({ users, total: await User.countDocuments() });
}));

router.patch('/admin/users/:id/status', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  if (!mongoId.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const parsed = z.object({ status: z.enum(['active', 'deactivated']) }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Invalid status' });
  const target = await User.findById(req.params.id).select('role status emailVerified');
  if (!target) return res.status(404).json({ error: 'Not found' });
  if (
    target.role !== 'USER' &&
    req.user?.role !== 'SUPER_ADMIN'
  ) {
    return res.status(403).json({ error: 'Only a SUPER_ADMIN can manage administrator accounts' });
  }
  if (String(target._id) === req.user?.id && parsed.data.status === 'deactivated') {
    return res.status(409).json({ error: 'You cannot deactivate your own account' });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { status: parsed.data.status }, $inc: { sessionVersion: 1 } },
    { new: true },
  ).select('-passwordHash -sessionVersion');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ user });
}));

router.patch('/admin/users/:id/role', authMiddleware, requireRole('SUPER_ADMIN'), asyncHandler(async (req, res) => {
  if (!mongoId.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const parsed = z.object({ role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']) }).safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Invalid role' });
  const target = await User.findById(req.params.id).select('role status emailVerified');
  if (!target) return res.status(404).json({ error: 'Not found' });
  if (parsed.data.role !== 'USER' && (target.status !== 'active' || !target.emailVerified)) {
    return res.status(409).json({ error: 'Only active, verified users can receive an administrator role' });
  }
  if (String(target._id) === req.user?.id && parsed.data.role !== 'SUPER_ADMIN') {
    const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN', status: 'active' });
    if (superAdminCount <= 1) {
      return res.status(409).json({ error: 'The last active SUPER_ADMIN cannot remove their own role' });
    }
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role: parsed.data.role }, $inc: { sessionVersion: 1 } },
    { new: true },
  ).select('-passwordHash -sessionVersion');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ user });
}));

export const adminRouter = router;
