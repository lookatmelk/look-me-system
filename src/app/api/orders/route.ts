import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import OrderRecord from '@/models/OrderRecord';
import CostingRecord from '@/models/CostingRecord';
import Shop from '@/models/Shop';
import mongoose from 'mongoose';

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
        { sampleNo: regex },
      ];
    }

    // Exact filters
    const status = searchParams.get('status');
    if (status) query.status = status;

    const designNo = searchParams.get('designNo');
    if (designNo) query.designNo = designNo;

    const sampleNo = searchParams.get('sampleNo');
    if (sampleNo) query.sampleNo = sampleNo;

    // Shop filter — orders with qty > 0 for a given shop
    const shopId = searchParams.get('shopId');
    if (shopId) {
      query['shopAllocations'] = {
        $elemMatch: {
          shopId: new mongoose.Types.ObjectId(shopId),
          qty: { $gt: 0 },
        },
      };
    }

    // Range filters — design total
    const minTotal = searchParams.get('minTotal');
    const maxTotal = searchParams.get('maxTotal');
    if (minTotal || maxTotal) {
      query.designTotal = {};
      if (minTotal) query.designTotal.$gte = Number(minTotal);
      if (maxTotal) query.designTotal.$lte = Number(maxTotal);
    }

    // Range filters — projected revenue
    const minRevenue = searchParams.get('minRevenue');
    const maxRevenue = searchParams.get('maxRevenue');
    if (minRevenue || maxRevenue) {
      query.projectedRevenue = {};
      if (minRevenue) query.projectedRevenue.$gte = Number(minRevenue);
      if (maxRevenue) query.projectedRevenue.$lte = Number(maxRevenue);
    }

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        const d = new Date(`${endDate}T00:00:00.000Z`);
        d.setUTCDate(d.getUTCDate() + 1); // Inclusive end date
        query.orderDate.$lt = d;
      }
    }

    // ─── Sort ───
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // ─── Limit ───
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.floor(Number(limitParam)) : null;

    // ─── Execute query with populate ───
    let recordsQuery = OrderRecord.find(query)
      .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
      .populate('shopAllocations.shopId', 'name slug color')
      .sort({ [sortBy]: sortOrder });

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

    // ─── Validate Required Fields ───
    if (!body.costingId) {
      return NextResponse.json(
        { success: false, error: 'Design selection (costingId) is required.' },
        { status: 400 }
      );
    }

    // ─── Validate CostingRecord Exists ───
    const costing = await CostingRecord.findById(body.costingId);
    if (!costing) {
      return NextResponse.json(
        { success: false, error: 'Selected design not found in costing records.' },
        { status: 404 }
      );
    }

    // ─── Validate Dynamic Shop Allocations ───
    if (!body.shopAllocations || !Array.isArray(body.shopAllocations) || body.shopAllocations.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one shop allocation is required.',
      }, { status: 400 });
    }

    const totalQty = body.shopAllocations.reduce((sum: number, a: any) => sum + (a.qty || 0), 0);
    if (totalQty <= 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one shop must have a quantity greater than 0.',
      }, { status: 400 });
    }

    // Validate each allocation's shopId exists and sizes
    for (const alloc of body.shopAllocations) {
      if (alloc.qty > 0) {
        const shop = await Shop.findById(alloc.shopId);
        if (!shop) {
          return NextResponse.json({
            success: false,
            error: `Shop not found: ${alloc.shopId}`,
          }, { status: 404 });
        }
        // Denormalize shop name
        alloc.shopName = shop.name;

        // Validate sizes
        if (!alloc.sizes || alloc.sizes.length === 0) {
          return NextResponse.json({
            success: false,
            error: `${shop.name} has a quantity but no sizes selected.`,
          }, { status: 400 });
        }
      }
    }

    // ─── Validate Status ───
    const validStatuses = ['PENDING', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${body.status}` },
        { status: 400 }
      );
    }

    // ─── Build payload ───
    const filteredAllocations = body.shopAllocations.filter((a: any) => a.qty > 0);

    const payload = {
      ...body,
      shopAllocations: filteredAllocations,
      designNo: costing.designNo,
      sampleNo: body.sampleNo || '',
      description: costing.description,
      sellingPrice: costing.sellingPrice,
      totalCost: costing.totalCost,
      profitPercentage: costing.profitPercentage,
      designTotal: totalQty,
    };

    // ─── Calculate derived fields ───
    payload.projectedRevenue = Number((costing.sellingPrice * payload.designTotal).toFixed(2));
    payload.projectedProfit = Number(
      ((costing.sellingPrice - costing.totalCost) * payload.designTotal).toFixed(2)
    );

    // ─── Set default status ───
    if (!payload.status) {
      payload.status = 'PENDING';
    }

    const record = await OrderRecord.create(payload);

    // Return populated doc
    const populatedRecord = await OrderRecord.findById(record._id)
      .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
      .populate('shopAllocations.shopId', 'name slug color');

    return NextResponse.json(
      { success: true, data: populatedRecord },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
