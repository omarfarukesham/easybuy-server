import { z } from 'zod';

export const orderItemSchema = z.object({ productId: z.string().min(1), quantity: z.number().min(1) });

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    zip: z.string().optional(),
  }),
  shippingZone: z.enum(['inside', 'outside']),
});
