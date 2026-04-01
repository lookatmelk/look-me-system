import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Shop from '@/models/Shop';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { location: regex }, { manager: regex }];
    }

    const shops = await Shop.find(query).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: shops });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Auto-generate slug from name
    if (body.name && !body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const shop = await Shop.create(body);
    return NextResponse.json({ success: true, data: shop }, { status: 201 });
  } catch (error: any) {
    // Handle duplicate name (code 11000 in MongoDB)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A shop with this name or slug already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
