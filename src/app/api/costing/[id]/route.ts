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

    // ─── Calculate line item amounts ───

    // Sewing: amount = rate × consumption
    if (payload.sewingItems) {
      payload.sewingItems = payload.sewingItems.map((item: any) => ({
        ...item,
        amount: Number((item.rate * item.consumption).toFixed(2)),
      }));
    }

    // Fabric: amount = (rate × consumption) + ((rate × consumption) / 100 × 5)
    if (payload.fabricItems) {
      payload.fabricItems = payload.fabricItems.map((item: any) => {
        const base = item.rate * item.consumption;
        return {
          ...item,
          amount: Number((base + (base / 100) * 5).toFixed(2)),
        };
      });
    }

    // Accessories: amount = rate × consumption
    if (payload.accessoriesItems) {
      payload.accessoriesItems = payload.accessoriesItems.map((item: any) => ({
        ...item,
        amount: Number((item.rate * item.consumption).toFixed(2)),
      }));
    }

    // Special: amount = rate × consumption
    if (payload.specialItems) {
      payload.specialItems = payload.specialItems.map((item: any) => ({
        ...item,
        amount: Number((item.rate * item.consumption).toFixed(2)),
      }));
    }

    // ─── Category Totals ───
    payload.sewingCost = Number(
      (payload.sewingItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );
    payload.fabricCost = Number(
      (payload.fabricItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );
    payload.accessoriesCost = Number(
      (payload.accessoriesItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );
    payload.specialCost = Number(
      (payload.specialItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0).toFixed(2)
    );

    // ─── Grand Total ───
    payload.totalCost = Number(
      (payload.sewingCost + payload.fabricCost + payload.accessoriesCost + payload.specialCost).toFixed(2)
    );

    // ─── Profit ───
    if (payload.sellingPrice !== undefined) {
      payload.grossProfit = Number((payload.sellingPrice - payload.totalCost).toFixed(2));
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
