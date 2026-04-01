import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shop from '@/models/Shop';
import OrderRecord from '@/models/OrderRecord';

// GET — single shop
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const shop = await Shop.findById(id);
    if (!shop) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: shop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// PUT — update shop
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Re-generate slug if name changed
    if (body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const shop = await Shop.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!shop) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: shop });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'A shop with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// DELETE — delete shop (only if no orders reference it)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    // Check if any orders reference this shop
    const orderCount = await OrderRecord.countDocuments({
      'shopAllocations.shopId': id,
    });

    if (orderCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete shop — ${orderCount} order(s) are allocated to it. Deactivate instead.`,
      }, { status: 409 });
    }

    const deleted = await Shop.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
