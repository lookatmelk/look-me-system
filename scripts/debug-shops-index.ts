import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');
  const collection = mongoose.connection.collection('shops');
  
  // print indexes
  const indexes = await collection.indexes();
  console.log('Indexes:', JSON.stringify(indexes, null, 2));

  // try inserting a generic shop to see what duplicate key error if any
  try {
    await collection.insertOne({
      name: "Debug Shop " + Date.now(),
      slug: "debug-shop-" + Date.now(),
      location: "",
      manager: "",
      phone: "",
      email: "",
      color: "blue",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Insert successful!');
  } catch (err) {
    console.log('Insert failed:', err);
  }
  
  mongoose.connection.close();
}

check();
