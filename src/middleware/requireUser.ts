import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing token' } });
  }
  const token = auth.split(' ')[1];
  try {
    const secret = process.env.JWT_USER_SECRET;
    if (!secret) throw new Error('JWT secret not configured');
    const payload = jwt.verify(token, secret) as any;
    const userId = payload.sub;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ error: { code: 'unauthorized', message: 'User not found' } });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid token' } });
  }
}
