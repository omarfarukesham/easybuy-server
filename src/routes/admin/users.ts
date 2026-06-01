import { Router, Request, Response } from 'express';
import User from '../../models/User';
import { adminUserQuery } from '../../validators/admin';

const router = Router();

// GET /api/admin/users — each user enriched with orderCount + totalSpent
router.get('/', async (req: Request, res: Response) => {
  const q = adminUserQuery.parse(req.query);

  const match: any = {};
  if (q.search) {
    match.$or = [
      { mobile: { $regex: q.search, $options: 'i' } },
      { name: { $regex: q.search, $options: 'i' } },
      { email: { $regex: q.search, $options: 'i' } },
    ];
  }

  const skip = (q.page - 1) * q.limit;

  const [data, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: q.limit },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders',
        },
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          totalSpent: { $sum: '$orders.total' },
        },
      },
      { $project: { orders: 0 } },
    ]),
    User.countDocuments(match),
  ]);

  res.json({ data, total, page: q.page, limit: q.limit });
});

export default router;
