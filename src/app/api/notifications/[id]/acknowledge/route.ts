import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Notification from '@/models/Notification';

export async function PATCH(
  _req: Request,
  ctx: RouteContext<'/api/notifications/[id]/acknowledge'>
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { status: 'ACKNOWLEDGED' },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
