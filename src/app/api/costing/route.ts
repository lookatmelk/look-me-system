import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // ─── Build Query ───
    const query: any = {};

    // Text search (case-insensitive regex)
    const search = searchParams.get('search');
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { designNo: regex },
        { description: regex },
      ];
    }

    // Exact filters
    const size = searchParams.get('size');
    if (size) query.sizes = size;

    // Range filters — profit percentage
    const minProfit = searchParams.get('minProfit');
    const maxProfit = searchParams.get('maxProfit');
    if (minProfit || maxProfit) {
      query.profitPercentage = {};
      if (minProfit) query.profitPercentage.$gte = Number(minProfit);
      if (maxProfit) query.profitPercentage.$lte = Number(maxProfit);
    }

    // Range filters — total cost
    const minTotalCost = searchParams.get('minTotalCost');
    const maxTotalCost = searchParams.get('maxTotalCost');
    if (minTotalCost || maxTotalCost) {
      query.totalCost = {};
      if (minTotalCost) query.totalCost.$gte = Number(minTotalCost);
      if (maxTotalCost) query.totalCost.$lte = Number(maxTotalCost);
    }

    // Range filters — selling price
    const minSellingPrice = searchParams.get('minSellingPrice');
    const maxSellingPrice = searchParams.get('maxSellingPrice');
    if (minSellingPrice || maxSellingPrice) {
      query.sellingPrice = {};
      if (minSellingPrice) query.sellingPrice.$gte = Number(minSellingPrice);
      if (maxSellingPrice) query.sellingPrice.$lte = Number(maxSellingPrice);
    }

    // ─── Sort ───
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // ─── Limit ───
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.floor(Number(limitParam)) : null;

    // ─── Execute query ───
    let recordsQuery = CostingRecord.find(query).sort({ [sortBy]: sortOrder });
    if (limit && limit > 0) {
      recordsQuery = recordsQuery.limit(limit);
    }

    const records = await recordsQuery;

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Calculate derived fields before saving
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

    const record = await CostingRecord.create(payload);

    return NextResponse.json(
      { success: true, data: record },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle duplicate designNo
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
