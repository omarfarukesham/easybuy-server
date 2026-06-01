import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
};

export const bannerCreateSchema = z.object({
  type: z.enum(['main', 'side']),
  image: z.string().trim().min(1),
  alt: z.string().trim().min(1),
  href: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional()),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const bannerUpdateSchema = bannerCreateSchema.partial().strict();

export const contactCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().toLowerCase(),
  mobile: z.preprocess(emptyStringToUndefined, z.string().trim().max(30).optional()),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
});

export const newsletterCreateSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminContactQuerySchema = pageQuerySchema.extend({
  unread: z.enum(['true', 'false']).optional(),
});

export const adminNewsletterQuerySchema = pageQuerySchema.extend({
  format: z.enum(['csv']).optional(),
});

export const dashboardStatsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});
