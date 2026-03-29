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
  const isChequePayment = paymentMode === 'CHEQUE';

  if (isChequePayment && !String(payload.chequeNumber || '').trim()) {
    return { error: 'Cheque Number is required for CHEQUE payments.' };
  }

  if (isChequePayment) {
    payload.chequeNumber = String(payload.chequeNumber).trim();
  } else {
    payload.chequeNumber = undefined;
  }

  if (!PAYMENT_DATE_REQUIRED_MODES.includes(paymentMode)) {
    payload.paymentDate = today;
  }

  if (PAYMENT_DATE_REQUIRED_MODES.includes(paymentMode) && !payload.paymentDate) {
    return { error: 'Payment Date is required for CHEQUE and CREDIT payments.' };
  }

  return { payload };
}

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
    const { payload, error } = applyPaymentRules(body);

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    if (payload.qty !== undefined && payload.rate !== undefined) {
      payload.amount = Number((payload.qty * payload.rate).toFixed(2));
    }

    const record = await PurchaseRecord.findByIdAndUpdate(id, payload, {
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
