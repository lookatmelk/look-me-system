import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PurchaseRecord from '@/models/PurchaseRecord';
import Category from '@/models/Category'; // Ensure Category is loaded

export async function GET() {
  try {
    await dbConnect();

    // To ensure the Category model is registered
    Category.init();

    // Fetch all records, populate category to get fabric names
    const records = await PurchaseRecord.find().populate('categoryId', 'name').lean();

    const descToFabricMap = new Map<string, string>();

    records.forEach((record: any) => {
      if (record.description && record.description.trim() !== '') {
        const desc = record.description.trim();
        const fabric = record.categoryId?.name || '';
        if (!descToFabricMap.has(desc)) {
          descToFabricMap.set(desc, fabric);
        }
      }
    });

    // Create an array and sort it alphabetically by description
    const sorted = Array.from(descToFabricMap.entries())
      .map(([description, fabric]) => ({ description, fabric }))
      .sort((a, b) => a.description.localeCompare(b.description));

    return NextResponse.json({
      success: true,
      data: sorted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
