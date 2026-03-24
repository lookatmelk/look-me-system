import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Supplier from '@/models/Supplier';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const supplier = await Supplier.create(body);
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    // Handle unique constraints
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { success: false, error: `Supplier with this ${field} already exists.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
