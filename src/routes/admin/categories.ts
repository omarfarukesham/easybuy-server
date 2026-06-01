import { Router, Request, Response } from 'express';
import Category from '../../models/Category';
import { categoryCreateSchema, categoryUpdateSchema } from '../../validators/admin';
import { slugify } from '../../utils/slugify';

const router = Router();

// GET /api/admin/categories — includes inactive categories
router.get('/', async (_req: Request, res: Response) => {
  const cats = await Category.find().sort({ sortOrder: 1 }).lean();
  res.json(cats);
});

// POST /api/admin/categories
router.post('/', async (req: Request, res: Response) => {
  const body = categoryCreateSchema.parse(req.body);
  const slug = body.slug ? slugify(body.slug) : slugify(body.name);

  const existing = await Category.findOne({ slug }).lean();
  if (existing) {
    return res.status(409).json({ error: { code: 'duplicate_slug', message: 'A category with this slug already exists' } });
  }

  const category = await Category.create({ ...body, slug });
  res.status(201).json(category);
});

// PUT /api/admin/categories/:id — partial update
router.put('/:id', async (req: Request, res: Response) => {
  const body = categoryUpdateSchema.parse(req.body);
  const update: any = { ...body };

  if (body.slug) {
    update.slug = slugify(body.slug);
    const clash = await Category.findOne({ slug: update.slug, _id: { $ne: req.params.id } }).lean();
    if (clash) {
      return res.status(409).json({ error: { code: 'duplicate_slug', message: 'A category with this slug already exists' } });
    }
  }

  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!category) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Category not found' } });
  }
  res.json(category);
});

// DELETE /api/admin/categories/:id
// Default: soft delete (active:false). ?hard=true performs a hard delete, owner-only.
router.delete('/:id', async (req: Request, res: Response) => {
  const hard = req.query.hard === 'true';

  if (hard) {
    if (req.admin.role !== 'owner') {
      return res.status(403).json({ error: { code: 'forbidden', message: 'Owner role required for hard delete' } });
    }
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { code: 'not_found', message: 'Category not found' } });
    }
    return res.json({ deleted: true, hard: true, id: req.params.id });
  }

  const category = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!category) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Category not found' } });
  }
  res.json({ deleted: true, hard: false, id: category._id, active: category.active });
});

export default router;
