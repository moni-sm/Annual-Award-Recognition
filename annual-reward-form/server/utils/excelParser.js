import * as XLSX from "xlsx";
import fs from "fs";
 
export const parseExcel = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
 
  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
    cellDates: true, // 📆 Tells XLSX to cleanly convert Excel date formats into actual JS Date objects
  });
 
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
 
  const rawData = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });
 
  console.log("\nExcel Headers:");
  console.log(Object.keys(rawData[0] || {}));
 
  const mappedData = rawData.map((row) => ({
    division: String(row.division || "").trim(),
    name: String(row.name || "").trim(),
    empId: String(row.empId || "").trim(),
    id: String(row.id || "").trim(),
    email: String(row.email || "").trim(),
    department: String(row.department || "").trim(),
    designation: String(row.designation || "").trim(),
    role: String(row.role || "").trim(),
    doj: row.doj ? new Date(row.doj) : null, // 👈 Extract and cast the date safely
  }));
 
  return mappedData;
};