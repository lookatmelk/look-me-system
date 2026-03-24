import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Supplier from '@/models/Supplier';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const supplier = await Supplier.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    // Check if supplier is linked to any active purchase records
    const isLinked = await mongoose.models.PurchaseRecord?.exists({ supplierId: id });
    if (isLinked) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete supplier because it is linked to one or more purchase records.' },
        { status: 400 }
      );
    }

    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
