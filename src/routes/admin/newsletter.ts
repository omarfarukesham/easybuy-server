import { Router, Request, Response } from 'express';
import NewsletterSubscription from '../../models/NewsletterSubscription';
import { adminNewsletterQuerySchema } from '../../validators/marketing';

const router = Router();

function csvValue(value: unknown) {
  if (value === undefined || value === null) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

// GET /api/admin/newsletter
router.get('/', async (req: Request, res: Response) => {
  const q = adminNewsletterQuerySchema.parse(req.query);
  const filter = { status: 'subscribed' };

  if (q.format === 'csv') {
    const subscribers = await NewsletterSubscription.find(filter).sort({ subscribedAt: -1 }).lean();
    const rows = [
      ['email', 'status', 'subscribedAt', 'unsubscribedAt'].map(csvValue).join(','),
      ...subscribers.map((subscriber) =>
        [
          subscriber.email,
          subscriber.status,
          subscriber.subscribedAt,
          subscriber.unsubscribedAt,
        ].map(csvValue).join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
    return res.send(rows.join('\n'));
  }

  const skip = (q.page - 1) * q.limit;
  const [data, total] = await Promise.all([
    NewsletterSubscription.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(q.limit).lean(),
    NewsletterSubscription.countDocuments(filter),
  ]);

  res.json({ data, total, page: q.page, limit: q.limit });
});

export default router;
