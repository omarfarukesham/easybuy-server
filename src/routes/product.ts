import { Router, Request, Response } from "express";
import { z } from "zod";
import Product from "../models/Product";

const router = Router();

const listQuery = z.object({
  category: z.string().optional(),
  featured: z.string().optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : 1)),
  limit: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : 20)),
});

router.get("/", async (req: Request, res: Response) => {
  const q = listQuery.parse(req.query);
  const filter: any = { active: true };
  if (q.category) filter["category"] = q.category;
  if (q.featured) filter["featured"] = q.featured === "true";
  if (q.search) filter["name"] = { $regex: q.search, $options: "i" };

  const page = q.page;
  const limit = Math.min(100, q.limit);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ data, total, page, limit });
});

router.get("/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug, active: true }).lean();
  if (!product)
    return res
      .status(404)
      .json({ error: { code: "not_found", message: "Product not found" } });
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    active: true,
  })
    .limit(4)
    .lean();
  res.json({ product, related });
});

export default router;
