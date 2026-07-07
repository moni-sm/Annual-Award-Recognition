<<<<<<< HEAD:annual-reward-form/server/routes/nominations.js
import express from "express";
import Nomination from "../models/Nomination.js";
import Employee from "../models/Employee.js";

const router = express.Router();

//  GET Unique Divisions
router.get("/divisions", async (req, res) => {
  try {
    const nominations = await Nomination.find({}, "division");
    const uniqueDivisions = [...new Set(nominations.map(n => n.division))];
    res.json(uniqueDivisions);
  } catch (err) {
    console.error("❌ Error fetching divisions:", err);
    res.status(500).json({ error: "Failed to fetch divisions" });
  }
});

// GET All Nominations
router.get("/", async (req, res) => {
  try {
    const nominations = await Nomination.find().sort({ createdAt: -1 });
    res.status(200).json(nominations);
  } catch (err) {
    console.error("❌ Error fetching nominations:", err);
    res.status(500).json({ error: "Failed to fetch nominations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      employeeName,
      employeeId,
      department,
      designation,
      employeeEmail,
      nominatorName,
      nominatorDept,
      nominatorDesig,
      nominatorEmail,
      awardType,
      yearOfNomination,
      answers,
    } = req.body;

    if (!employeeName || !employeeId || !yearOfNomination || !answers || !awardType) {
      return res.status(400).json({ error: "Missing required nomination parameters" });
    }

    // 1. Fetch nominee profile data to determine their assigned Division context
    const nomineeProfile = await Employee.findOne({ empId: employeeId });
    if (!nomineeProfile) {
      return res.status(404).json({ error: "Nominee record not found in master database" });
    }
    const targetDivision = nomineeProfile.division;
    const targetDept = department || nomineeProfile.department;

    const normalizedAward = awardType.toLowerCase();

    // ─── RULE 3: CKONNECT EXCLUSION ───
    // if (targetDivision.toUpperCase().includes("CKONNECT") && normalizedAward.includes("cash award")) {
    //   return res.status(403).json({ 
    //     error: "Validation Exception: CKONNECT division handles a separate allocation matrix and is excluded from standard Cash Awards." 
    //   });
    // }

    // Determine current budget window half-year block (H1: Jan-Jun, H2: Jul-Dec)
    // const currentMonth = new Date().getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
    // const currentHalfYearQuery = currentMonth < 6 
    //   ? { $expr: { $lt: [{ $month: "$createdAt" }, 7] } } 
    //   : { $expr: { $gte: [{ $month: "$createdAt" }, 7] } };

    // ─── RULE 1: SPOT AWARD QUOTA (MAX 50% OF DEPT HEADCOUNT) ───
    // if (normalizedAward.includes("spot award")) {
    //   const deptHeadcount = await Employee.countDocuments({ department: targetDept });
    //   const maxAllowedSpotAwards = Math.floor(deptHeadcount * 0.5);

    //   // Total allocated within the department for the current year cycle
    //   const totalDeptSpotAwardsAllocated = await Nomination.countDocuments({
    //     department: targetDept,
    //     awardType: { $regex: new RegExp("spot award", "i") },
    //     yearOfNomination
    //   });

    //   if (totalDeptSpotAwardsAllocated >= maxAllowedSpotAwards) {
    //     return res.status(422).json({
    //       error: `Quota Exhausted: Spot awards for ${targetDept} are capped at 50% of active headcount (${maxAllowedSpotAwards} total slots).`
    //     });
    //   }
    // }

    // ─── RULE 2: CASH AWARD LIMITS BY DIVISION SIZE ───
    // if (normalizedAward.includes("cash award")) {
    //   const divisionHeadcount = await Employee.countDocuments({ division: targetDivision });
      
    //   // Compute hard cap proportional limits based on business definitions
    //   let maxAllowedCashAwards = 2; // Standard safety threshold baseline
    //   if (divisionHeadcount >= 80) {
    //     maxAllowedCashAwards = 7;
    //   } else if (divisionHeadcount >= 40) {
    //     maxAllowedCashAwards = 4;
    //   }

    //   // Query database for cash awards allocated to this division in the current 6-month block
    //   const current6MonthCashCount = await Nomination.countDocuments({
    //     ...currentHalfYearQuery,
    //     awardType: { $regex: new RegExp("cash award", "i") },
    //     yearOfNomination
    //   });

    //   // We map nominations to divisions by looking up the nominees' original profiles
    //   const historicalNominations = await Nomination.find({ 
    //     awardType: { $regex: new RegExp("cash award", "i") },
    //     yearOfNomination,
    //     ...currentHalfYearQuery 
    //   });

    //   let allocatedToDivisionCount = 0;
    //   for (const nom of historicalNominations) {
    //     const empLookup = await Employee.findOne({ empId: nom.employeeId }, "division");
    //     if (empLookup && empLookup.division === targetDivision) {
    //       allocatedToDivisionCount++;
    //     }
    //   }

    //   if (allocatedToDivisionCount >= maxAllowedCashAwards) {
    //     return res.status(422).json({
    //       error: `Budget Caps Exceeded: Cash Awards for ${targetDivision} are strictly capped at ${maxAllowedCashAwards} instances per 6-month period.`
    //     });
    //   }
    // }

    // ─── WRITE ENTRY LAYER ───
    const newData = {
      employeeName,
      employeeId,
      department: targetDept,
      designation,
      employeeEmail,
      nominatorName,
      nominatorDept,
      nominatorDesig,
      nominatorEmail,
      awardType,
      yearOfNomination,
      answers,
    };

    const existing = await Nomination.findOne({ employeeId, yearOfNomination });

    if (existing) {
      await Nomination.findByIdAndUpdate(existing._id, newData);
      res.status(200).json({ message: "Nomination updated successfully." });
    } else {
      const newNomination = new Nomination(newData);
      await newNomination.save();
      res.status(201).json({ message: "Nomination submitted successfully." });
    }
  } catch (err) {
    console.error("❌ Error submitting nomination:", err);
    res.status(500).json({ error: "Internal validation framework exception during submission." });
  }
});

router.get('/download/all', async (req, res) => {
  try {
    const nominations = await Nomination.find();
    console.log("✅ nominations found:", nominations.length);
    res.status(200).json(nominations);
  } catch (error) {
    console.error('Error fetching nominations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ DELETE All Nominations
router.delete("/", async (req, res) => {
  try {
    await Nomination.deleteMany({});
    res.status(200).json({ message: "All nominations deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting nominations:", err);
    res.status(500).json({ error: "Failed to delete nominations" });
  }
});

export default router;
=======
import express from "express";
import Nomination from "../models/Nomination.js";

const router = express.Router();

// ✅ GET Unique Divisions (if used)
router.get("/divisions", async (req, res) => {
  try {
    const nominations = await Nomination.find({}, "division");
    const uniqueDivisions = [...new Set(nominations.map(n => n.division))];
    res.json(uniqueDivisions);
  } catch (err) {
    console.error("❌ Error fetching divisions:", err);
    res.status(500).json({ error: "Failed to fetch divisions" });
  }
});

// ✅ GET All Nominations
router.get("/", async (req, res) => {
  try {
    const nominations = await Nomination.find().sort({ createdAt: -1 });
    res.status(200).json(nominations);
  } catch (err) {
    console.error("❌ Error fetching nominations:", err);
    res.status(500).json({ error: "Failed to fetch nominations" });
  }
});

// ✅ POST: Submit or Update Nomination
router.post("/", async (req, res) => {
  try {
    const {
      employeeName,
      employeeId,
      department,
      designation,
      employeeEmail,
      nominatorName,
      nominatorDept,
      nominatorDesig,
      nominatorEmail,
      awardType,
      yearOfNomination,
      answers,
    } = req.body;

    if (!employeeName || !employeeId || !yearOfNomination || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newData = {
      employeeName,
      employeeId,
      department,
      designation,
      employeeEmail,
      nominatorName,
      nominatorDept,
      nominatorDesig,
      nominatorEmail,
      awardType,
      yearOfNomination,
      answers,
    };

    const existing = await Nomination.findOne({ employeeId, yearOfNomination });

    if (existing) {
      await Nomination.findByIdAndUpdate(existing._id, newData);
    } else {
      const newNomination = new Nomination(newData);
      await newNomination.save();
    }

    res.status(201).json({ message: "Nomination submitted successfully." });
  } catch (err) {
    console.error("❌ Error submitting nomination:", err);
    res.status(500).json({ error: "Failed to submit nomination" });
  }
});

router.get('/download/all', async (req, res) => {
  try {
    const nominations = await Nomination.find(); // Check your DB
    console.log("✅ nominations found:", nominations.length); // log the result count
    res.status(200).json(nominations);
  } catch (error) {
    console.error('Error fetching nominations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ✅ DELETE All Nominations
router.delete("/", async (req, res) => {
  try {
    await Nomination.deleteMany({});
    res.status(200).json({ message: "All nominations deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting nominations:", err);
    res.status(500).json({ error: "Failed to delete nominations" });
  }
})

export default router;
>>>>>>> origin/client-updates:server/routes/nominations.js
