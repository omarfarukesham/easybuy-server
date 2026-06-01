import { Router, Request, Response } from 'express';
import Category from '../models/Category';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const cats = await Category.find({ active: true }).sort({ sortOrder: 1 }).lean();
  res.json(cats);
});

export default router;
