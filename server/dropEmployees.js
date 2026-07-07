// dropEmployees.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dropCollection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const exists = collections.some(c => c.name === 'employees');

    if (!exists) {
      console.log('ℹ️ "employees" collection does not exist');
    } else {
      await db.dropCollection('employees');
      console.log('✅ "employees" collection dropped');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to drop collection:', err.message);
    process.exit(1);
  }
};

dropCollection();
