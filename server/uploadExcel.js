import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { parseExcel } from './utils/excelParser.js';
import Employee from './models/Employee.js';

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const uploadData = async () => {
  try {
    const filePath = 'C:\\Users\\Monika Sm\\Annual-Rewards\\annual-reward-form\\server\\uploads\\EmployeeDatabase.xlsx';
    const data = parseExcel(filePath);

    // ❗ Log skipped rows
    const invalidRows = data.filter(emp => !emp.empId);
    if (invalidRows.length > 0) {
      console.warn(`⚠️ ${invalidRows.length} rows skipped due to missing empId`);
    }

    // ❗ Filter and remove duplicates
    const filteredData = data.filter(emp => emp.empId);
    const uniqueEmpMap = new Map();
    for (const emp of filteredData) {
      if (!uniqueEmpMap.has(emp.empId)) {
        uniqueEmpMap.set(emp.empId, emp);
      }
    }

    const uniqueEmployees = Array.from(uniqueEmpMap.values());

    // 🧹 Clear previous records
    await Employee.deleteMany({});
    console.log('🧹 Cleared all existing employee records');

    // ✅ Insert new records
    await Employee.insertMany(uniqueEmployees);
    console.log(`✅ Uploaded ${uniqueEmployees.length} unique employee records`);

    // 🗑️ Delete file after upload
    fs.unlinkSync(filePath);
    console.log('🗑️ Excel file deleted after upload');

  } catch (err) {
    console.error('❌ Error uploading data:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

const run = async () => {
  await connectToDB();
  await uploadData();
};

run();
