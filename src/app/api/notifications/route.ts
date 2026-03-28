import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const query: Record<string, unknown> = {};

    if (statusParam) {
      const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        query.status = statuses[0];
      } else if (statuses.length > 1) {
        query.status = { $in: statuses };
      }
    }

    const notifications = await Notification.find(query)
      .populate({
        path: 'purchaseRecordId',
        select: 'description supplierId paymentDate amount paymentMode',
        populate: { path: 'supplierId', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
