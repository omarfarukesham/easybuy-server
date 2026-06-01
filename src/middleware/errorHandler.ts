import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'validation_error', message: 'Invalid request', fields: err.issues } });
  }
  if (err && err.code === 'OUT_OF_STOCK') {
    return res.status(409).json({ error: { code: 'out_of_stock', message: 'Insufficient stock', fields: err.details } });
  }
  // Mongo duplicate key (e.g. unique slug/email race)
  if (err && err.code === 11000) {
    return res.status(409).json({ error: { code: 'duplicate', message: 'Resource already exists', fields: err.keyValue } });
  }
  return res.status(500).json({ error: { code: 'internal_error', message: 'Internal server error' } });
}
