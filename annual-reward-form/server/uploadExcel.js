
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import mongoose from "mongoose";
import fs from "fs";

import { parseExcel } from "./utils/excelParser.js";
import Employee from "./models/Employee.js";


dns.setDefaultResultOrder("ipv4first");


dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const connectToDB = async () => {
  try {
    console.log("URI loaded:", !!process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      }
      // ssl: true,
      // tlsAllowInvalidCertificates: true,
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:");
    console.error(err);
    process.exit(1);
  }
};

const uploadData = async () => {
  try {
    // const filePath = path.join(
    //   process.cwd(),
    //   "uploads",
    //   "employees_test_data.xlsx"
    // );
const filePath = "D:\\Annualawards\\Annual-award\\annual-reward-form\\server\\uploads\\employees_test_data.xlsx";
    console.log("\n📂 Looking for Excel file at:");
    console.log(filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found:\n${filePath}`);
    }

    const data = parseExcel(filePath);

    console.log(`\n Total rows parsed: ${data.length}`);

    if (data.length > 0) {
      console.log("\n First parsed row:");
      console.log(data[0]);
    }

    const invalidRows = data.filter((emp) => !emp.empId);

    if (invalidRows.length > 0) {
      console.warn(
        `\n ${invalidRows.length} rows skipped due to missing Employee ID`
      );

      console.log("\nSample invalid row:");
      console.log(invalidRows[0]);
    }

    const filteredData = data.filter((emp) => emp.empId);

    console.log(`\n Valid rows: ${filteredData.length}`);

    const uniqueEmpMap = new Map();

    filteredData.forEach((emp) => {
      if (!uniqueEmpMap.has(emp.empId)) {
        uniqueEmpMap.set(emp.empId, emp);
      }
    });

    const uniqueEmployees = Array.from(uniqueEmpMap.values());

   
    await Employee.deleteMany({});
    console.log(" Cleared existing employee records");

    if (uniqueEmployees.length > 0) {
      await Employee.insertMany(uniqueEmployees);

      console.log(
        ` Successfully uploaded ${uniqueEmployees.length} employees`
      );
    } else {
      console.log(" No valid employee records found to upload.");
    }
  } catch (err) {
    console.error("\n Upload failed:");
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB disconnected");
  }
};

const run = async () => {
  await connectToDB();
  await uploadData();
};

run();
