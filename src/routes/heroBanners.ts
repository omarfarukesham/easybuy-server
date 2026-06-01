import { Router, Request, Response } from 'express';
import HeroBanner from '../models/HeroBanner';

const router = Router();

// GET /api/hero-banners
router.get('/', async (_req: Request, res: Response) => {
  const banners = await HeroBanner.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();

  res.json({
    heroSlides: banners.filter((banner) => banner.type === 'main'),
    sideBanners: banners.filter((banner) => banner.type === 'side'),
  });
});

export default router;
