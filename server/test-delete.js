import fs from "fs";
import path from "path";

const filename = "1753938206912-QCLW074MQAP022 Procure test of elect electronic instru equipment.pdf"; // Use a real file
const filePath = path.resolve("uploads", filename);

console.log("🧪 Checking file:", filePath);

if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
  console.log("✅ File deleted:", filePath);
} else {
  console.log("❌ File not found:", filePath);
}
