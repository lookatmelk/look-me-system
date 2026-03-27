import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import PurchaseRecord from '@/models/PurchaseRecord';
import { getResendClient } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SENDER_EMAIL = 'hello.lookatme.lk@gmail.com';
const RECIPIENT_EMAIL = 'lookatmetextile@gmail.com';
const HIGH_VALUE_THRESHOLD = 100000;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

function getReminderOffsets(amount: number) {
  if (amount > HIGH_VALUE_THRESHOLD) return [3, 1];
  if (amount < HIGH_VALUE_THRESHOLD) return [1];
  return [];
}

function buildReminderKey(recordId: string, paymentDate: Date, daysBefore: number) {
  return `${recordId}:${formatDate(paymentDate)}:${daysBefore}`;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function sendReminderEmail(record: any, daysBefore: number) {
  const resend = getResendClient();
  const paymentDate = new Date(record.paymentDate);
  const supplierName = record.supplierId?.name || 'Unknown Supplier';
  const categoryName = record.categoryId?.name || 'Unknown Category';

  const subject = `Cheque Payment Reminder: ${daysBefore} day${daysBefore === 1 ? '' : 's'} left`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">Cheque Payment Reminder</h2>
      <p style="margin: 0 0 10px;">
        This is an automated reminder for a scheduled cheque payment due in <strong>${daysBefore} day${daysBefore === 1 ? '' : 's'}</strong>.
      </p>
      <ul style="margin: 0 0 12px; padding-left: 18px;">
        <li><strong>Description:</strong> ${record.description}</li>
        <li><strong>Supplier:</strong> ${supplierName}</li>
        <li><strong>Category:</strong> ${categoryName}</li>
        <li><strong>Amount:</strong> LKR ${formatCurrency(record.amount || 0)}</li>
        <li><strong>Payment Date:</strong> ${formatDate(paymentDate)}</li>
      </ul>
      <p style="margin: 0; color: #4b5563; font-size: 12px;">
        Record ID: ${record._id}
      </p>
    </div>
  `;

  return resend.emails.send({
    from: SENDER_EMAIL,
    to: RECIPIENT_EMAIL,
    subject,
    html,
  });
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const today = startOfUtcDay(new Date());
    const tomorrow = addUtcDays(today, 1);
    const fourDaysOut = addUtcDays(today, 4);

    const records = await PurchaseRecord.find({
      paymentMode: 'CHEQUE',
      status: 'PENDING',
      paymentDate: { $gte: tomorrow, $lt: fourDaysOut },
    })
      .populate('supplierId', 'name')
      .populate('categoryId', 'name')
      .lean();

    let checked = 0;
    let sent = 0;
    let skipped = 0;
    const failures: Array<{ id: string; error: string }> = [];

    for (const record of records) {
      checked += 1;

      const paymentDate = new Date(record.paymentDate);
      const daysBefore = diffUtcDays(today, paymentDate);
      const offsets = getReminderOffsets(Number(record.amount || 0));

      if (!offsets.includes(daysBefore)) {
        skipped += 1;
        continue;
      }

      const reminderKey = buildReminderKey(String(record._id), paymentDate, daysBefore);
      const alreadySent = Array.isArray(record.emailReminderKeys) && record.emailReminderKeys.includes(reminderKey);

      if (alreadySent) {
        skipped += 1;
        continue;
      }

      try {
        await sendReminderEmail(record, daysBefore);

        await PurchaseRecord.updateOne(
          { _id: record._id },
          { $addToSet: { emailReminderKeys: reminderKey } }
        );

        sent += 1;
      } catch (error: any) {
        failures.push({ id: String(record._id), error: error?.message || 'Unknown email failure' });
      }
    }

    return NextResponse.json({
      success: failures.length === 0,
      summary: {
        checked,
        sent,
        skipped,
        failed: failures.length,
      },
      failures,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected cron error' },
      { status: 500 }
    );
  }
}
