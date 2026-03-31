import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const record = await CostingRecord.findById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Costing record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Recalculate derived fields
    const payload = { ...body };

    if (payload.fabricPrice !== undefined && payload.fabricConsumption !== undefined) {
      payload.fabricCost = Number(
        (payload.fabricPrice * payload.fabricConsumption).toFixed(2)
      );
    }

    payload.totalCost = Number(
      (
        (payload.fabricCost || 0) +
        (payload.sewingCost || 0) +
        (payload.accessoriesCost || 0) +
        (payload.printBelt || 0) +
        (payload.threadLabelsPollyBags || 0) +
        (payload.fusingElasticButtonZip || 0)
      ).toFixed(2)
    );

    if (payload.sellingPrice !== undefined) {
      payload.grossProfit = Number(
        (payload.sellingPrice - payload.totalCost).toFixed(2)
      );
    }

    if (payload.sellingPrice && payload.sellingPrice > 0) {
      payload.profitPercentage = Number(
        ((payload.grossProfit / payload.sellingPrice) * 100).toFixed(2)
      );
    } else {
      payload.profitPercentage = 0;
    }

    const record = await CostingRecord.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Costing record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A costing record with this design number already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await CostingRecord.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Costing record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
