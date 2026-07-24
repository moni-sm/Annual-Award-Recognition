import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { parseExcel } from "./utils/excelParser.js";
import Employee from "./models/Employee.js";

const run = async () => {
  try {
    // 1. Connect DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // 2. Read File
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "Copy of shared by Kapil.xlsx"
    );

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at: ${filePath}`);
    }

    const rawData = parseExcel(filePath);
    console.log(`📊 Total rows parsed from file: ${rawData.length}`);

    if (!rawData || rawData.length === 0) {
      console.log("❌ Excel parser returned 0 rows. Check your excelParser.js utility.");
      return;
    }

    // Print first row to inspect exact object shape
    console.log("🔍 First row sample structure:", JSON.stringify(rawData[0], null, 2));

    // Flexible key matcher
    const getValue = (row, ...possibleKeys) => {
      const rowKeys = Object.keys(row);
      for (const key of possibleKeys) {
        const foundKey = rowKeys.find(
          (k) => k.trim().toLowerCase() === key.toLowerCase()
        );
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return String(row[foundKey]).trim();
        }
      }
      return "";
    };

    // 3. Map Excel records to Schema structure
    const mappedEmployees = rawData.map((row, index) => {
      // Look for ID in all common variants, or fallback to row index if no ID header exists
      let empId = getValue(row, "id", "sl no", "empid", "emp id", "employee id", "sl.no");
      
      // If still empty, check if row has ANY value at all
      if (!empId) {
        const firstVal = Object.values(row).find(v => v !== null && v !== undefined && String(v).trim() !== "");
        if (firstVal) empId = `EMP-${index + 1}`; // Fallback ID if row has data but missing explicit ID header
      }

      return {
        empId,
        id: empId,
        name: getValue(row, "name"),
        email: getValue(row, "official email", "email", "mail"),
        division: getValue(row, "division"),
        department: getValue(row, "department"),
        designation: getValue(row, "designation"),
        role: getValue(row, "role"),
        gender: getValue(row, "gender"),
        location: getValue(row, "location"),
        levels: getValue(row, "levels", "level"),
        doj: getValue(row, "doj") ? new Date(getValue(row, "doj")) : null,
      };
    });

    // 4. Filter out empty rows
    const validEmployees = mappedEmployees.filter((emp) => emp.empId !== "");
    console.log(`✅ Valid records mapped: ${validEmployees.length}`);

    // 5. Deduplicate by empId
    const uniqueEmployees = Array.from(
      new Map(validEmployees.map((emp) => [emp.empId, emp])).values()
    );
    console.log(`🧹 Unique records to insert: ${uniqueEmployees.length}`);

    if (uniqueEmployees.length === 0) {
      console.log("⚠️ No valid rows found after mapping. Aborting DB wipe/insert.");
      return;
    }

    // 6. Delete existing data
    const deleted = await Employee.deleteMany({});
    console.log(`🗑️ Cleared ${deleted.deletedCount} existing records from DB`);

    // 7. Insert clean data
    const inserted = await Employee.insertMany(uniqueEmployees, { ordered: false });
    console.log(`🎉 Successfully inserted ${inserted.length} records into MongoDB!`);

  } catch (err) {
    console.error("❌ Process failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

run();