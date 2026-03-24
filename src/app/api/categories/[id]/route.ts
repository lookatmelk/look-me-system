import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Category from '@/models/Category';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const category = await Category.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const isLinked = await mongoose.models.PurchaseRecord?.exists({ categoryId: id });
    if (isLinked) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category because it is used in one or more purchase records.' },
        { status: 400 }
      );
    }

    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
