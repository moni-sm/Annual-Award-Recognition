import * as XLSX from "xlsx";
import fs from "fs";

const excelDateToJSDate = (value) => {
  if (!value) return null;

  // Already a Date object
  if (value instanceof Date) {
    return value;
  }

  // Excel serial date number
  if (typeof value === "number") {
    return new Date(
      Math.round((value - 25569) * 86400 * 1000)
    );
  }

  // String date
  return new Date(value);
};

export const parseExcel = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);

  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawData = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });

  console.log("\nExcel Headers:");
  console.log(Object.keys(rawData[0] || {}));

  const mappedData = rawData.map((row) => ({
    division: String(row["Division"] || "").trim(),

    empId: String(row["Emp ID"] || "").trim(),

    name: String(row["Name"] || "").trim(),

    id: String(row["Employee Considered"] || "").trim(),

    email: String(row["Email ID"] || "").trim(),

    department: String(row["Department"] || "").trim(),

    designation: String(row["Designation"] || "").trim(),

    role: String(row["Role"] || "").trim(),

    gender: String(row["Gender"] || "").trim(),

    doj: excelDateToJSDate(row["DOJ"]),
  }));

  return mappedData;
};