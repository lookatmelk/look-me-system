import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Category from '@/models/Category';

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const category = await Category.create(body);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
