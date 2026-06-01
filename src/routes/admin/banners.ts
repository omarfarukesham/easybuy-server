import { Router, Request, Response } from 'express';
import HeroBanner from '../../models/HeroBanner';
import { bannerCreateSchema, bannerUpdateSchema } from '../../validators/marketing';

const router = Router();

// GET /api/admin/banners
router.get('/', async (_req: Request, res: Response) => {
  const banners = await HeroBanner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json(banners);
});

// POST /api/admin/banners
router.post('/', async (req: Request, res: Response) => {
  const body = bannerCreateSchema.parse(req.body);
  const banner = await HeroBanner.create(body);
  res.status(201).json(banner);
});

// PUT /api/admin/banners/:id
router.put('/:id', async (req: Request, res: Response) => {
  const body = bannerUpdateSchema.parse(req.body);
  const banner = await HeroBanner.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });

  if (!banner) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Banner not found' } });
  }

  res.json(banner);
});

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const banner = await HeroBanner.findByIdAndUpdate(req.params.id, { active: false }, { new: true });

  if (!banner) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Banner not found' } });
  }

  res.json({ deleted: true, id: banner._id, active: banner.active });
});

export default router;
