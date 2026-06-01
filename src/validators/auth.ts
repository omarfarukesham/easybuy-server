import { z } from 'zod';

export const sendOtpSchema = z.object({ mobile: z.string().regex(/^01\d{9}$/, 'Invalid mobile') });

export const verifyOtpSchema = z.object({ requestId: z.string().min(1), code: z.string().length(6) });
