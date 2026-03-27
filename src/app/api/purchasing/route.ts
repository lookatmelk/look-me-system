import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PurchaseRecord from '@/models/PurchaseRecord';

const PAYMENT_DATE_REQUIRED_MODES = ['CHEQUE', 'CREDIT'];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function applyPaymentRules(body: any) {
  const payload = { ...body };
  const paymentMode = payload.paymentMode;
  const today = getTodayString();

  if (!PAYMENT_DATE_REQUIRED_MODES.includes(paymentMode)) {
    payload.paymentDate = today;
  }

  if (PAYMENT_DATE_REQUIRED_MODES.includes(paymentMode) && !payload.paymentDate) {
    return { error: 'Payment Date is required for CHEQUE and CREDIT payments.' };
  }

  if (PAYMENT_DATE_REQUIRED_MODES.includes(paymentMode)) {
    payload.status = 'PENDING';
  } else {
    payload.status = 'DONE';
  }

  return { payload };
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const categoryId = searchParams.get('categoryId');
    
    let query: any = {};
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (categoryId) query.categoryId = categoryId;

    const records = await PurchaseRecord.find(query)
      .populate('supplierId', 'name')
      .populate('categoryId', 'name imageUrl')
      .sort({ buyDate: -1 });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { payload, error } = applyPaymentRules(body);

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }
    
    if (payload.qty && payload.rate) {
      payload.amount = Number((payload.qty * payload.rate).toFixed(2));
    }

    const record = await PurchaseRecord.create(payload);
    
    // Return populated doc
    const populatedRecord = await PurchaseRecord.findById(record._id)
      .populate('supplierId', 'name')
      .populate('categoryId', 'name imageUrl');

    return NextResponse.json({ success: true, data: populatedRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
