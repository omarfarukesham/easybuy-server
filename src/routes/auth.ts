import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import OtpRequest from '../models/OtpRequest';
import User from '../models/User';
import { sendOtpSms } from '../services/sms.service';
import { sendOtpSchema, verifyOtpSchema } from '../validators/auth';
import jwt from 'jsonwebtoken';

const router = Router();

const perIpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
const perMobileLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => (req.body && req.body.mobile) || req.ip,
});

router.post('/otp/send', perIpLimiter, perMobileLimiter, async (req: Request, res: Response) => {
  const { mobile } = sendOtpSchema.parse(req.body);

  // cooldown: 60s
  const last = await OtpRequest.findOne({ mobile }).sort({ createdAt: -1 });
  if (last) {
    const age = Date.now() - new Date(last.createdAt).getTime();
    if (age < 60 * 1000) {
      return res.status(429).json({ error: { code: 'too_many_requests', message: 'Please wait before requesting another OTP' } });
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const ttl = Number(process.env.OTP_TTL_SECONDS || 300);
  const expiresAt = new Date(Date.now() + ttl * 1000);

  const doc = await OtpRequest.create({ mobile, codeHash, expiresAt });

  await sendOtpSms(mobile, code);

  res.json({ requestId: doc._id, expiresIn: ttl });
});

router.post('/otp/verify', async (req: Request, res: Response) => {
  const { requestId, code } = verifyOtpSchema.parse(req.body);
  const doc = await OtpRequest.findById(requestId);
  if (!doc) return res.status(400).json({ error: { code: 'invalid_request', message: 'OTP request not found' } });
  if (doc.expiresAt.getTime() < Date.now()) return res.status(400).json({ error: { code: 'expired', message: 'OTP expired' } });
  if (doc.attempts >= 5) return res.status(400).json({ error: { code: 'max_attempts', message: 'Max verify attempts exceeded' } });

  const ok = await bcrypt.compare(code, doc.codeHash);
  doc.attempts += 1;
  if (!ok) {
    await doc.save();
    if (doc.attempts >= 5) {
      // invalidate
      doc.expiresAt = new Date();
      await doc.save();
      return res.status(400).json({ error: { code: 'max_attempts', message: 'Max verify attempts exceeded' } });
    }
    return res.status(400).json({ error: { code: 'invalid_code', message: 'Incorrect code' } });
  }

  doc.verifiedAt = new Date();
  await doc.save();

  // upsert user
  const user = await User.findOneAndUpdate({ mobile: doc.mobile }, { $setOnInsert: { mobile: doc.mobile } }, { upsert: true, new: true });

  const secret = process.env.JWT_USER_SECRET;
  if (!secret) return res.status(500).json({ error: { code: 'config', message: 'JWT secret not configured' } });
  const token = jwt.sign({ sub: user._id.toString(), role: 'user' }, secret, { expiresIn: process.env.JWT_USER_EXPIRES_IN || '7d' } as jwt.SignOptions);

  res.json({ token, user: { id: user._id, mobile: user.mobile, name: user.name, email: user.email } });
});

router.get('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing token' } });
  const token = auth.split(' ')[1];
  try {
    const secret = process.env.JWT_USER_SECRET;
    const payload = jwt.verify(token, secret as string) as any;
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ error: { code: 'unauthorized', message: 'User not found' } });
    res.json({ id: user._id, mobile: user.mobile, name: user.name, email: user.email });
  } catch (err) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid token' } });
  }
});

export default router;
