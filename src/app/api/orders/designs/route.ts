import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import CostingRecord from '@/models/CostingRecord';

export async function GET() {
  try {
    await dbConnect();

    // Get all costing records with essential fields for the dropdown
    const designs = await CostingRecord.find({})
      .select('designNo description sellingPrice totalCost profitPercentage size')
      .sort({ designNo: 1 });

    return NextResponse.json({
      success: true,
      data: designs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
