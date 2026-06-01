import { Router, Request, Response } from 'express';
import ContactMessage from '../../models/ContactMessage';
import { adminContactQuerySchema } from '../../validators/marketing';

const router = Router();

// GET /api/admin/contact
router.get('/', async (req: Request, res: Response) => {
  const q = adminContactQuerySchema.parse(req.query);
  const filter: any = {};

  if (q.unread === 'true') {
    filter.$or = [{ readAt: { $exists: false } }, { readAt: null }];
  }

  const skip = (q.page - 1) * q.limit;
  const [data, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    ContactMessage.countDocuments(filter),
  ]);

  res.json({ data, total, page: q.page, limit: q.limit });
});

// PATCH /api/admin/contact/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  const contactMessage = await ContactMessage.findByIdAndUpdate(req.params.id, { readAt: new Date() }, { new: true });

  if (!contactMessage) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Contact message not found' } });
  }

  res.json(contactMessage);
});

export default router;
