import { Router } from 'express';
import { requireAdmin } from '../../middleware/requireAdmin';
import authRoutes from './auth';
import productRoutes from './products';
import categoryRoutes from './categories';
import uploadRoutes from './upload';
import orderRoutes from './orders';
import userRoutes from './users';
import bannerRoutes from './banners';
import dashboardRoutes from './dashboard';
import contactRoutes from './contact';
import newsletterRoutes from './newsletter';

const router = Router();

// /auth handles its own guards (login is public + rate-limited, /me is protected).
router.use('/auth', authRoutes);

// Every other admin route requires a valid admin token.
router.use('/products', requireAdmin, productRoutes);
router.use('/categories', requireAdmin, categoryRoutes);
router.use('/upload', requireAdmin, uploadRoutes);
router.use('/orders', requireAdmin, orderRoutes);
router.use('/users', requireAdmin, userRoutes);
router.use('/banners', requireAdmin, bannerRoutes);
router.use('/dashboard', requireAdmin, dashboardRoutes);
router.use('/contact', requireAdmin, contactRoutes);
router.use('/newsletter', requireAdmin, newsletterRoutes);

export default router;
