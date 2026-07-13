import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import employeeRoutes from './routes/employees.js';
import nominationRoutes from "./routes/nominations.js";
import authRoutes from "./auth/auth.js";
import awardConfigRoutes from "./routes/awardConfig.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  serverApi: { version: '1', strict: true, deprecationErrors: true },
  ssl: true,
  tlsAllowInvalidCertificates: true, // Use only if you're testing locally or have self-signed certs
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB Error:', err));


app.use('/api/employees', employeeRoutes);
app.use("/api/nominations", nominationRoutes);
app.get("/api/nominations/stats-test", (req, res) => {
  res.status(200).json({ message: "Global server hook is working!" });
});
app.use("/api/auth", authRoutes);
app.use("/api/award-config", awardConfigRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

