import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import productRoutes from './src/routes/product';
import categoryRoutes from './src/routes/categories';
import authRoutes from './src/routes/auth';
import orderRoutes from './src/routes/orders';
import heroBannerRoutes from './src/routes/heroBanners';
import contactRoutes from './src/routes/contact';
import newsletterRoutes from './src/routes/newsletter';
import adminRoutes from './src/routes/admin';
import { errorHandler } from './src/middleware/errorHandler';
import { connectDB } from './src/config/db';

dotenv.config();

const app = express();

// CORS open to all origins (no credentials — incompatible with wildcard origin).
app.use(cors());
app.use(express.json());

// Health check — no DB needed.
app.get('/', (_req, res) => res.send('EasyBuyCorner API running'));

// Ensure a (cached) DB connection before handling any API route. On serverless
// the process may be a cold start with no open connection yet.
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/hero-banners', heroBannerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
