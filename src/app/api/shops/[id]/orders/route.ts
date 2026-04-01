import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shop from '@/models/Shop';
import OrderRecord from '@/models/OrderRecord';
import mongoose from 'mongoose';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const shop = await Shop.findById(id);
    if (!shop) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Query orders that have an allocation for this shop with qty > 0
    const query: any = {
      'shopAllocations': {
        $elemMatch: {
          shopId: new mongoose.Types.ObjectId(id),
          qty: { $gt: 0 },
        },
      },
    };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) {
        const d = new Date(`${endDate}T00:00:00.000Z`);
        d.setUTCDate(d.getUTCDate() + 1);
        query.orderDate.$lt = d;
      }
    }

    const orders = await OrderRecord.find(query)
      .populate('costingId', 'designNo description sellingPrice totalCost')
      .sort({ orderDate: -1 });

    // Calculate shop-specific stats
    const stats = orders.reduce(
      (acc, order) => {
        // Find this shop's allocation in the order
        const alloc = order.shopAllocations.find(
          (a: any) => a.shopId.toString() === id
        );
        if (alloc) {
          acc.totalQty += alloc.qty;
          acc.totalRevenue += alloc.qty * (order.sellingPrice || 0);
          acc.totalProfit += alloc.qty * ((order.sellingPrice || 0) - (order.totalCost || 0));
        }
        return acc;
      },
      { totalOrders: orders.length, totalQty: 0, totalRevenue: 0, totalProfit: 0 }
    );

    return NextResponse.json({
      success: true,
      data: { shop, orders, stats },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
