import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Order, { OrderStatus } from '../../models/Order';
import Product from '../../models/Product';
import User from '../../models/User';
import { adminOrderQuery, orderStatusSchema } from '../../validators/admin';

const router = Router();

// Allowed forward transitions. delivered/cancelled are terminal.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'shipped', 'cancelled'],
  confirmed: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

// GET /api/admin/orders
router.get('/', async (req: Request, res: Response) => {
  const q = adminOrderQuery.parse(req.query);
  const filter: any = {};

  if (q.status) filter.status = q.status;

  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = new Date(q.from);
    if (q.to) filter.createdAt.$lte = new Date(q.to);
  }

  if (q.search) {
    // search matches orderId OR the ordering user's mobile
    const users = await User.find({ mobile: { $regex: q.search, $options: 'i' } }).select('_id').lean();
    const userIds = users.map((u) => u._id);
    filter.$or = [
      { orderId: { $regex: q.search, $options: 'i' } },
      { user: { $in: userIds } },
    ];
  }

  const skip = (q.page - 1) * q.limit;
  const [data, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(q.limit)
      .populate('user', 'mobile name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ data, total, page: q.page, limit: q.limit });
});

// PATCH /api/admin/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response, next) => {
  const { status: nextStatus } = orderStatusSchema.parse(req.body);
  const { id } = req.params;

  const session = await mongoose.startSession();
  try {
    let result: any;
    let httpError: any = null;

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) {
        httpError = { code: 404, body: { error: { code: 'not_found', message: 'Order not found' } } };
        return;
      }

      const current = order.status as OrderStatus;

      if (current === nextStatus) {
        httpError = { code: 409, body: { error: { code: 'no_change', message: `Order is already ${nextStatus}` } } };
        return;
      }
      if (!TRANSITIONS[current].includes(nextStatus)) {
        httpError = {
          code: 422,
          body: { error: { code: 'invalid_transition', message: `Cannot change status from ${current} to ${nextStatus}` } },
        };
        return;
      }

      if (nextStatus === 'cancelled') {
        // Atomically flip to cancelled ONLY if not already cancelled. This makes
        // concurrent cancel attempts safe — only the winner restocks.
        const flipped = await Order.findOneAndUpdate(
          { _id: id, status: { $ne: 'cancelled' } },
          { $set: { status: 'cancelled' } },
          { new: true, session }
        );
        if (!flipped) {
          // Lost the race; another request already cancelled + restocked.
          result = order;
          return;
        }
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
        }
        result = flipped;
      } else {
        order.status = nextStatus;
        await order.save({ session });
        result = order;
      }
    });

    if (httpError) {
      return res.status(httpError.code).json(httpError.body);
    }
    res.json(result);
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
});

export default router;
