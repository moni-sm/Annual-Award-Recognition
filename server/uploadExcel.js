import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { parseExcel } from "./utils/excelParser.js";
import Employee from "./models/Employee.js";

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const uploadData = async () => {
  try {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "employees_test_data.xlsx"
    );

    console.log(`📂 Reading Excel: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error("Excel file not found.");
    }

    // Parse Excel
    const data = parseExcel(filePath);

    console.log(`📊 Total rows found: ${data.length}`);

    // Remove empty Employee IDs
    const validEmployees = data.filter(
      (emp) => emp.empId && emp.empId.trim() !== ""
    );

    console.log(`✅ Valid rows: ${validEmployees.length}`);

    // Remove duplicate Employee IDs
    const uniqueEmployees = Array.from(
      new Map(validEmployees.map((emp) => [emp.empId, emp])).values()
    );

    console.log(`🧹 Unique Employees: ${uniqueEmployees.length}`);

    // Delete all existing employees
    const deleted = await Employee.deleteMany({});
    console.log(`🗑️ Deleted ${deleted.deletedCount} existing employee records`);

    // Insert new employees
    if (uniqueEmployees.length > 0) {
      await Employee.insertMany(uniqueEmployees);
      console.log(
        `✅ Successfully uploaded ${uniqueEmployees.length} employee records`
      );
    } else {
      console.log("⚠️ No valid employees found in the Excel file.");
    }

  } catch (err) {
    console.error("❌ Upload failed:");
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

const run = async () => {
  await connectToDB();
  await uploadData();
};

run();