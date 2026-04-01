import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import OrderRecord from '@/models/OrderRecord';

export async function GET() {
  try {
    await dbConnect();

    const stats = await OrderRecord.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalUnits: { $sum: '$designTotal' },
          totalRevenue: { $sum: '$projectedRevenue' },
          totalProfit: { $sum: '$projectedProfit' },
          avgDesignTotal: { $avg: '$designTotal' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
          },
          inProductionOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PRODUCTION'] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalUnits: 0,
      totalRevenue: 0,
      totalProfit: 0,
      avgDesignTotal: 0,
      pendingOrders: 0,
      inProductionOrders: 0,
      deliveredOrders: 0,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
