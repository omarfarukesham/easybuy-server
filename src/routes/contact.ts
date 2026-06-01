import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import ContactMessage from '../models/ContactMessage';
import { contactCreateSchema } from '../validators/marketing';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'too_many_requests', message: 'Too many contact submissions from this IP' } },
});

// POST /api/contact
router.post('/', contactLimiter, async (req: Request, res: Response) => {
  const body = contactCreateSchema.parse(req.body);
  const contactMessage = await ContactMessage.create(body);
  res.status(201).json({ id: contactMessage._id, createdAt: contactMessage.createdAt });
});

export default router;
