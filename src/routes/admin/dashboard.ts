import { Router, Request, Response } from 'express';
import Order, { OrderStatus } from '../../models/Order';
import User from '../../models/User';
import { dashboardStatsQuerySchema } from '../../validators/marketing';

const router = Router();

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateBoundary(value: string, endOfDay: boolean) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  }
  return new Date(value);
}

function dateRangeFromQuery(query: { from?: string; to?: string }) {
  const to = query.to ? parseDateBoundary(query.to, true) : new Date();
  const from = query.from ? parseDateBoundary(query.from, false) : new Date(to.getTime() - 30 * DAY_MS);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() > to.getTime()) {
    return null;
  }

  return { from, to };
}

// GET /api/admin/dashboard/stats
router.get('/stats', async (req: Request, res: Response) => {
  const q = dashboardStatsQuerySchema.parse(req.query);
  const range = dateRangeFromQuery(q);

  if (!range) {
    return res.status(400).json({ error: { code: 'validation_error', message: 'Invalid date range' } });
  }

  const match = { createdAt: { $gte: range.from, $lte: range.to } };

  const [summaryRows, topProducts, statusRows, dailyRevenue, newUsers] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.nameSnapshot' },
          sold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.priceSnapshot', '$items.quantity'] } },
        },
      },
      { $sort: { sold: -1, revenue: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, productId: '$_id', name: 1, sold: 1, revenue: 1 } },
    ]),
    Order.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1 } },
    ]),
    User.countDocuments(match),
  ]);

  const summary = summaryRows[0] || { revenue: 0, orderCount: 0 };
  const ordersByStatus: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const row of statusRows as Array<{ _id: OrderStatus; count: number }>) {
    if (ORDER_STATUSES.includes(row._id)) {
      ordersByStatus[row._id] = row.count;
    }
  }

  res.json({
    revenue: summary.revenue,
    orderCount: summary.orderCount,
    avgOrderValue: summary.orderCount > 0 ? summary.revenue / summary.orderCount : 0,
    newUsers,
    topProducts,
    ordersByStatus,
    dailyRevenue,
  });
});

export default router;
