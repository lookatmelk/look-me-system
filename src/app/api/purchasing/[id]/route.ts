import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PurchaseRecord from '@/models/PurchaseRecord';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const record = await PurchaseRecord.findById(id)
      .populate('supplierId', 'name')
      .populate('categoryId', 'name imageUrl');
    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (body.qty !== undefined && body.rate !== undefined) {
      body.amount = Number((body.qty * body.rate).toFixed(2));
    }

    const record = await PurchaseRecord.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate('supplierId', 'name')
      .populate('categoryId', 'name imageUrl');

    if (!record) {
      return NextResponse.json({ success: false, error: 'Purchase record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedRecord = await PurchaseRecord.findByIdAndDelete(id);
    if (!deletedRecord) {
      return NextResponse.json({ success: false, error: 'Purchase record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
