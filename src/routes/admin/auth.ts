import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../../models/Admin';
import { requireAdmin } from '../../middleware/requireAdmin';
import { adminLoginSchema } from '../../validators/admin';

const router = Router();

// 5 attempts per IP per 15 minutes on login.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

function publicAdmin(a: any) {
  return { id: a._id, email: a.email, name: a.name, role: a.role, createdAt: a.createdAt };
}

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = adminLoginSchema.parse(req.body);

  const admin = await Admin.findOne({ email: email.toLowerCase() });

  // Generic 401 whether the email is unknown or the password is wrong — never
  // leak which one failed.
  const ok = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
  if (!admin || !ok) {
    return res.status(401).json({ error: { code: 'invalid_credentials', message: 'Invalid email or password' } });
  }

  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret) return res.status(500).json({ error: { code: 'config', message: 'Admin JWT secret not configured' } });

  const token = jwt.sign(
    { sub: admin._id.toString(), role: 'admin' },
    secret,
    { expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '1d' } as jwt.SignOptions
  );

  res.json({ token, admin: publicAdmin(admin) });
});

router.get('/me', requireAdmin, async (req: Request, res: Response) => {
  res.json(publicAdmin(req.admin));
});

export default router;
