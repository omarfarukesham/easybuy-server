import express from 'express';
import mongoose from 'mongoose';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/easybuy';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// CORS open to all origins (no credentials — incompatible with wildcard origin).
app.use(cors());
app.use(express.json());

// Serve uploaded images.
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/', (req, res) => res.send('EasyBuyCorner API running'));

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/hero-banners', heroBannerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err: unknown) => {
    console.error('MongoDB connection error:', err);
    if (err instanceof Error) console.error(err.message);
    process.exit(1);
  });
