import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PurchaseRecord from '@/models/PurchaseRecord';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

const HIGH_VALUE_THRESHOLD = 100_000;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addUtcDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function diffUtcDays(from: Date, to: Date) {
  const diffMs = startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function formatDate(date: Date) {
  return startOfUtcDay(date).toISOString().split('T')[0];
}

function getReminderOffsets(amount: number): number[] {
  if (amount > HIGH_VALUE_THRESHOLD) return [3, 1];
  return [1]; // ≤ 100,000 gets 1-day reminder
}

function buildReminderKey(
  recordId: string,
  paymentDate: Date,
  daysBefore: number
) {
  return `${recordId}:${formatDate(paymentDate)}:${daysBefore}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function POST() {
  try {
    await dbConnect();

    const today = startOfUtcDay(new Date());
    const tomorrow = addUtcDays(today, 1);
    const fourDaysOut = addUtcDays(today, 4);

    // Find all CHEQUE + PENDING records with paymentDate in the relevant window
    const records = await PurchaseRecord.find({
      paymentMode: 'CHEQUE',
      status: 'PENDING',
      paymentDate: { $gte: tomorrow, $lt: fourDaysOut },
    })
      .populate('supplierId', 'name')
      .lean();

    let created = 0;
    let skipped = 0;

    for (const record of records) {
      const paymentDate = new Date(record.paymentDate);
      const daysBefore = diffUtcDays(today, paymentDate);
      const offsets = getReminderOffsets(Number(record.amount || 0));

      if (!offsets.includes(daysBefore)) {
        skipped += 1;
        continue;
      }

      const reminderKey = buildReminderKey(
        String(record._id),
        paymentDate,
        daysBefore
      );

      // Check if this notification already exists (idempotent)
      const exists = await Notification.findOne({ reminderKey }).lean();
      if (exists) {
        skipped += 1;
        continue;
      }

      const supplierName =
        (record.supplierId as any)?.name || 'Unknown Supplier';

      const title =
        daysBefore === 1
          ? 'Cheque Payment Due Tomorrow'
          : `Cheque Payment Due in ${daysBefore} Days`;

      const message = `${record.description} — ${supplierName} — ${formatCurrency(
        record.amount
      )} due on ${formatDate(paymentDate)}`;

      await Notification.create({
        purchaseRecordId: record._id,
        type: 'CHEQUE_REMINDER',
        title,
        message,
        amount: record.amount,
        paymentDate: record.paymentDate,
        daysBefore,
        status: 'UNREAD',
        reminderKey,
      });

      created += 1;
    }

    return NextResponse.json({
      success: true,
      summary: { created, skipped },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
