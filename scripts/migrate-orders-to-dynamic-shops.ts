import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import mongoose from 'mongoose';
import dbConnect from '../src/lib/mongoose';

async function migrate() {
  await dbConnect();
  const db = mongoose.connection.db;
  if (!db) {
      console.error("Database connection failed!");
      process.exit(1);
  }
  const ordersCol = db.collection('orderrecords');
  const shopsCol = db.collection('shops');

  // 1. Ensure shops exist
  const existingShops = await shopsCol.find({}).toArray();
  let shopMap: Record<string, { _id: any; name: string }> = {};

  if (existingShops.length === 0) {
    // Create default shops
    const defaults = [
      { name: 'Shop 1', slug: 'shop-1', color: 'blue', status: 'ACTIVE', location: '', manager: '', phone: '', email: '', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Shop 2', slug: 'shop-2', color: 'violet', status: 'ACTIVE', location: '', manager: '', phone: '', email: '', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Shop 3', slug: 'shop-3', color: 'emerald', status: 'ACTIVE', location: '', manager: '', phone: '', email: '', createdAt: new Date(), updatedAt: new Date() },
    ];
    const result = await shopsCol.insertMany(defaults);
    defaults.forEach((d, i) => {
      shopMap[`shop${i + 1}`] = { _id: result.insertedIds[i], name: d.name };
    });
    console.log("Created 3 default shops.");
  } else {
    // Match by name pattern
    existingShops.forEach(s => {
      if (s.name === 'Shop 1') shopMap['shop1'] = { _id: s._id, name: s.name };
      if (s.name === 'Shop 2') shopMap['shop2'] = { _id: s._id, name: s.name };
      if (s.name === 'Shop 3') shopMap['shop3'] = { _id: s._id, name: s.name };
    });
    console.log("Using existing shops matching Shop 1/2/3.");
  }

  // 2. Migrate each order
  const orders = await ordersCol.find({ shop1: { $exists: true } }).toArray();
  console.log(`Migrating ${orders.length} orders...`);

  let count = 0;
  for (const order of orders) {
    const shopAllocations: any[] = [];

    for (const key of ['shop1', 'shop2', 'shop3'] as const) {
      const shopData = order[key];
      if (shopData && shopData.qty > 0 && shopMap[key]) {
        shopAllocations.push({
          shopId: shopMap[key]._id,
          shopName: shopMap[key].name,
          qty: shopData.qty,
          sizes: shopData.sizes || [],
        });
      }
    }

    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set: { shopAllocations },
        $unset: { shop1: '', shop2: '', shop3: '' },
      }
    );
    count++;
  }

  console.log(`Migration complete! Successfully migrated ${count} orders to use dynamic shopAllocations.`);
  process.exit(0);
}

migrate().catch(console.error);
