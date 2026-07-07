import express from "express";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";
import UserAuth from "./UserAuth.js";

const router = express.Router();


router.post("/login", async (req, res) => {
  try {
    const { division, email, password } = req.body;

    if (!division || !email || !password) {
      return res.status(400).json({ error: "Missing required fields: division, email, password" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Structural Check: Ensure the user actually exists in the Master Employee Record
    const employeeRecord = await Employee.findOne({ 
      email: normalizedEmail, 
      division: { $regex: new RegExp(`^${division.trim()}$`, "i") } 
    });

    if (!employeeRecord) {
      return res.status(403).json({ 
        error: "Access Denied: Email and Division do not match existing employee records." 
      });
    }

    // 2. Check if an account already exists in our Auth Collection
    let authRecord = await UserAuth.findOne({ email: normalizedEmail });

    if (authRecord) {
      // Existing User Workflow: Validate password
      const isMatch = await authRecord.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid password credentials." });
      }

      return res.status(200).json({
        message: "Login successful!",
        user: {
          name: employeeRecord.name,
          email: employeeRecord.email,
          division: employeeRecord.division,
          designation: employeeRecord.designation
        }
      });
    } else {
      // ➡️ New User Workflow: Capture and assign their newly submitted password
      const newAuth = new UserAuth({
        email: normalizedEmail,
        division: employeeRecord.division, // Use clean database spelling
        password: password
      });

      await newAuth.save();

      return res.status(201).json({
        message: "Account activated and password set successfully!",
        user: {
          name: employeeRecord.name,
          email: employeeRecord.email,
          division: employeeRecord.division,
          designation: employeeRecord.designation
        }
      });
    }

  } catch (err) {
    console.error("❌ Authentication Error:", err);
    res.status(500).json({ error: "Internal server error during authentication." });
  }
});

export default router;