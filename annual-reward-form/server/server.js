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


app.use(cors({
  origin: process.env.CLIENT_URL || '*', 
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  credentials: true
}));
app.use(express.json());


mongoose.connect(process.env.MONGO_URI, {
  serverApi: { version: '1', strict: true, deprecationErrors: true },
  ssl: true,
  tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));


app.use('/api/employees', employeeRoutes);
app.use("/api/nominations", nominationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/award-config", awardConfigRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});


app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl} - Route not found` });
});


app.use((err, req, res, next) => {
  console.error("🔥 Global Server Error Caught:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});