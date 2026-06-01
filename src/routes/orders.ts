import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Order from '../models/Order';
import { requireUser } from '../middleware/requireUser';
import { createOrderSchema } from '../validators/orders';
import { generateOrderId } from '../utils/generateOrderId';

const router = Router();

router.post('/', requireUser, async (req: Request, res: Response, next) => {
  try {
    const body = createOrderSchema.parse(req.body);
    const userId = req.user._id;

    const session = await mongoose.startSession();
    let savedOrder: any;
    await session.withTransaction(async () => {
      // re-fetch products and check stock
      const productIds = body.items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap: any = {};
      products.forEach((p) => (productMap[p._id.toString()] = p));

      const outOfStock: any[] = [];
      for (const item of body.items) {
        const p = productMap[item.productId];
        if (!p) {
          outOfStock.push({ productId: item.productId, available: 0 });
        } else if (p.stock < item.quantity) {
          outOfStock.push({ productId: item.productId, available: p.stock });
        }
      }
      if (outOfStock.length) {
        const err: any = new Error('Out of stock');
        err.code = 'OUT_OF_STOCK';
        err.details = outOfStock;
        throw err;
      }

      // decrement stock and prepare snapshots
      const itemsSnapshot: any[] = [];
      let subtotal = 0;
      for (const item of body.items) {
        const p = productMap[item.productId];
        p.stock = p.stock - item.quantity;
        await p.save({ session });
        itemsSnapshot.push({ product: p._id, nameSnapshot: p.name, priceSnapshot: p.price, quantity: item.quantity });
        subtotal += p.price * item.quantity;
      }

      const shippingFee = body.shippingZone === 'inside' ? Number(process.env.SHIPPING_FEE_INSIDE_DHAKA || 80) : Number(process.env.SHIPPING_FEE_OUTSIDE_DHAKA || 120);
      const total = subtotal + shippingFee;

      const orderId = generateOrderId();
      const orderDoc = await Order.create([
        {
          orderId,
          user: userId,
          items: itemsSnapshot,
          shippingAddress: body.shippingAddress,
          shippingZone: body.shippingZone,
          shippingFee,
          subtotal,
          total,
          paymentMethod: 'cod',
        },
      ], { session });
      savedOrder = orderDoc[0];
    });
    await session.endSession();

    res.status(201).json({ orderId: savedOrder.orderId, status: savedOrder.status, total: savedOrder.total, createdAt: savedOrder.createdAt });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireUser, async (req: Request, res: Response) => {
  const userId = req.user._id;
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

router.get('/:orderId', requireUser, async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  const order = await Order.findOne({ orderId, user: userId }).lean();
  if (!order) return res.status(404).json({ error: { code: 'not_found', message: 'Order not found' } });
  res.json(order);
});

export default router;
