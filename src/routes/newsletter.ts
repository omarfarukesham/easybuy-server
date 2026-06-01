import { Router, Request, Response } from 'express';
import NewsletterSubscription from '../models/NewsletterSubscription';
import { newsletterCreateSchema } from '../validators/marketing';

const router = Router();

async function subscribe(email: string) {
  const now = new Date();
  return NewsletterSubscription.findOneAndUpdate(
    { email },
    {
      $set: { email, status: 'subscribed', subscribedAt: now },
      $unset: { unsubscribedAt: '' },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

// POST /api/newsletter
router.post('/', async (req: Request, res: Response) => {
  const { email } = newsletterCreateSchema.parse(req.body);

  try {
    const subscription = await subscribe(email);
    return res.json({ status: subscription?.status || 'subscribed' });
  } catch (err: any) {
    if (err?.code !== 11000) throw err;

    const subscription = await subscribe(email);
    return res.json({ status: subscription?.status || 'subscribed' });
  }
});

export default router;
