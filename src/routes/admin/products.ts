import { Router, Request, Response } from 'express';
import Product from '../../models/Product';
import { productCreateSchema, productUpdateSchema, adminProductQuery } from '../../validators/admin';
import { slugify } from '../../utils/slugify';

const router = Router();

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);

// GET /api/admin/products — includes inactive products
router.get('/', async (req: Request, res: Response) => {
  const q = adminProductQuery.parse(req.query);
  const filter: any = {};
  if (q.search) filter.name = { $regex: q.search, $options: 'i' };
  if (q.category) filter.category = q.category;
  if (q.lowStock === 'true') filter.stock = { $lte: LOW_STOCK_THRESHOLD };

  const skip = (q.page - 1) * q.limit;
  const [data, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ data, total, page: q.page, limit: q.limit });
});

// POST /api/admin/products
router.post('/', async (req: Request, res: Response) => {
  const body = productCreateSchema.parse(req.body);
  const slug = body.slug ? slugify(body.slug) : slugify(body.name);

  const existing = await Product.findOne({ slug }).lean();
  if (existing) {
    return res.status(409).json({ error: { code: 'duplicate_slug', message: 'A product with this slug already exists' } });
  }

  const product = await Product.create({ ...body, slug });
  res.status(201).json(product);
});

// PUT /api/admin/products/:id — partial update
router.put('/:id', async (req: Request, res: Response) => {
  const body = productUpdateSchema.parse(req.body);
  const update: any = { ...body };

  // If slug (or name with intent to re-slug) provided, normalize and guard uniqueness.
  if (body.slug) {
    update.slug = slugify(body.slug);
    const clash = await Product.findOne({ slug: update.slug, _id: { $ne: req.params.id } }).lean();
    if (clash) {
      return res.status(409).json({ error: { code: 'duplicate_slug', message: 'A product with this slug already exists' } });
    }
  }

  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!product) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Product not found' } });
  }
  res.json(product);
});

// DELETE /api/admin/products/:id
// Default: soft delete (active:false). ?hard=true performs a hard delete, owner-only.
router.delete('/:id', async (req: Request, res: Response) => {
  const hard = req.query.hard === 'true';

  if (hard) {
    // Hard delete is owner-only.
    if (req.admin.role !== 'owner') {
      return res.status(403).json({ error: { code: 'forbidden', message: 'Owner role required for hard delete' } });
    }
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { code: 'not_found', message: 'Product not found' } });
    }
    return res.json({ deleted: true, hard: true, id: req.params.id });
  }

  const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!product) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Product not found' } });
  }
  res.json({ deleted: true, hard: false, id: product._id, active: product.active });
});

export default router;
