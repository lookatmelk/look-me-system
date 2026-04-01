import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import OrderRecord from '@/models/OrderRecord';
import Shop from '@/models/Shop';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const record = await OrderRecord.findById(id)
      .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
      .populate('shopAllocations.shopId', 'name slug color');

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Order record not found' },
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

    const payload = { ...body };

    // If shopAllocations is provided, validate and denormalize
    if (payload.shopAllocations) {
      if (!Array.isArray(payload.shopAllocations) || payload.shopAllocations.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'At least one shop allocation is required.',
        }, { status: 400 });
      }

      const totalQty = payload.shopAllocations.reduce((sum: number, a: any) => sum + (a.qty || 0), 0);
      if (totalQty <= 0) {
        return NextResponse.json({
          success: false,
          error: 'At least one shop must have a quantity greater than 0.',
        }, { status: 400 });
      }

      for (const alloc of payload.shopAllocations) {
        if (alloc.qty > 0) {
          const shop = await Shop.findById(alloc.shopId);
          if (!shop) {
            return NextResponse.json({
              success: false,
              error: `Shop not found: ${alloc.shopId}`,
            }, { status: 404 });
          }
          alloc.shopName = shop.name;

          if (!alloc.sizes || alloc.sizes.length === 0) {
            return NextResponse.json({
              success: false,
              error: `${shop.name} has a quantity but no sizes selected.`,
            }, { status: 400 });
          }
        }
      }

      // Filter out empty allocations
      payload.shopAllocations = payload.shopAllocations.filter((a: any) => a.qty > 0);
      payload.designTotal = totalQty;
    }

    // If costing snapshot values are present, recalculate projections
    // (Note: designTotal will be recalculated securely by Mongoose pre-save hooks,
    // but we can set properties directly to maintain old UI bindings if needed)
    
    // Use schema hook for calculations if using .save(), but we're using findByIdAndUpdate
    // So we manually calculate them here.
    const currentDoc = await OrderRecord.findById(id);
    if (!currentDoc) {
      return NextResponse.json(
        { success: false, error: 'Order record not found' },
        { status: 404 }
      );
    }

    const newDesignTotal = payload.designTotal !== undefined ? payload.designTotal : currentDoc.designTotal;
    const newSellingPrice = payload.sellingPrice !== undefined ? payload.sellingPrice : currentDoc.sellingPrice;
    const newTotalCost = payload.totalCost !== undefined ? payload.totalCost : currentDoc.totalCost;

    payload.projectedRevenue = Number((newSellingPrice * newDesignTotal).toFixed(2));
    payload.projectedProfit = Number(((newSellingPrice - newTotalCost) * newDesignTotal).toFixed(2));


    const record = await OrderRecord.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
    .populate('costingId', 'designNo description sellingPrice totalCost profitPercentage sizes')
    .populate('shopAllocations.shopId', 'name slug color');

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Order record not found' },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await OrderRecord.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Order record not found' },
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
