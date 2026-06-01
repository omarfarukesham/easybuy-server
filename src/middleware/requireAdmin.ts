import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

declare global {
  namespace Express {
    interface Request {
      admin?: any;
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing token' } });
  }
  const token = auth.split(' ')[1];
  try {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) throw new Error('JWT admin secret not configured');
    const payload = jwt.verify(token, secret) as any;
    // Admin tokens are signed with role:"admin". Anything else (e.g. a user
    // token that somehow verified) must be rejected.
    if (payload.role !== 'admin') {
      return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid token' } });
    }
    const admin = await Admin.findById(payload.sub).lean();
    if (!admin) {
      return res.status(401).json({ error: { code: 'unauthorized', message: 'Admin not found' } });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid token' } });
  }
}

/**
 * Guard a route to owner-only admins. Must run after requireAdmin.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.admin || req.admin.role !== 'owner') {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Owner role required' } });
  }
  next();
}
