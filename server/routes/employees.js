import express from "express";
import Employee from "../models/Employee.js";

const router = express.Router();

router.get("/divisions", async (req, res) => {
  try {
    const employees = await Employee.find({}, "division"); // correct model
    const uniqueDivisions = [...new Set(employees.map(e => e.division))];
    res.json(uniqueDivisions);
  } catch (err) {
    console.error("❌ Error fetching divisions:", err);
    res.status(500).json({ error: "Failed to fetch divisions" });
  }
});

// ✅ GET all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// ✅ POST new employee
router.post("/", async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    console.error("❌ Error adding employee:", err);
    res.status(500).json({ error: "Failed to add employee" });
  }
});

// ✅ PUT update existing employee
router.put("/:id", async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(updatedEmployee);
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// ✅ DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);

    if (!deletedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;
