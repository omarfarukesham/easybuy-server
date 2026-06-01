import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Shared product field shape. Create requires name + price; update makes all optional.
const productFields = {
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  category: z.string().min(1).optional(),
  brand: z.string().optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  image: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  rating: z.number().min(0).optional(),
  reviewCount: z.number().min(0).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
};

export const productCreateSchema = z.object(productFields);

export const productUpdateSchema = z
  .object({
    ...productFields,
    name: z.string().min(1).optional(),
    price: z.number().min(0).optional(),
  })
  .strict();

// Shared category field shape. Create requires name; update makes all optional.
const categoryFields = {
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().optional(),
  active: z.boolean().optional(),
};

export const categoryCreateSchema = z.object(categoryFields);

export const categoryUpdateSchema = z
  .object({
    ...categoryFields,
    name: z.string().min(1).optional(),
  })
  .strict();

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

// ---- query schemas ----

const pageLimit = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const adminProductQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.string().optional(),
  ...pageLimit,
});

export const adminOrderQuery = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  ...pageLimit,
});

export const adminUserQuery = z.object({
  search: z.string().optional(),
  ...pageLimit,
});
