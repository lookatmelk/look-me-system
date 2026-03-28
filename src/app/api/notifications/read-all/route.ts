import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Notification from '@/models/Notification';

export async function PATCH() {
  try {
    await dbConnect();

    const result = await Notification.updateMany(
      { status: { $in: ['UNREAD', 'ACKNOWLEDGED'] } },
      { status: 'READ' }
    );

    return NextResponse.json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
