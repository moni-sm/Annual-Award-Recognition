import express from "express";
import Nomination from "../models/Nomination.js";
import PDFDocument from "pdfkit"; // 👈 Imported PDFKit

const router = express.Router();

// ✅ GET Unique Divisions
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

// ✅ POST Submit/Update Nomination
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

    if (!employeeName || !employeeId || !yearOfNomination || !answers || !nominatorEmail || !awardType) {
      return res.status(400).json({ error: "Missing required nomination fields." });
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

    const existing = await Nomination.findOne({ 
      employeeId, 
      awardType, 
      nominatorEmail, 
      yearOfNomination 
    });

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
    res.status(500).json({ error: "Failed to submit nomination" });
  }
});

// ✅ GET Export All Excel Data
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

// 📄 ✅ NEW: GET Individual Nominee PDF Report
router.get("/download-pdf/:employeeName", async (req, res) => {
  try {
    // Find the latest nomination record for this specific person
    const nomination = await Nomination.findOne({ employeeName: req.params.employeeName }).sort({ createdAt: -1 });

    if (!nomination) {
      return res.status(404).json({ error: "Nomination data not found for this candidate" });
    }

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    // Set Response Headers to download file cleanly
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Nomination_${nomination.employeeName.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // --- Styling Constants matching UI palette ---
    const primaryColor = "#e76f51";   // Dark peach accent line/text
    const boxBgColor = "#fcd5b5";      // Background peach block tone
    const inputBgColor = "#e9967a";    // Darker form field block tone
    const textColor = "#264653";       // Deep slate for readable print

    // 1. Header Title
    doc.fillColor(primaryColor).fontSize(24).font("Helvetica-Bold").text("🎉 Annual Award Nomination Report 🎉", { align: "center" });
    doc.moveDown(1.5);

    // 2. Information Split Grid Container Box
    // Draw outer section background container
    doc.rect(40, doc.y, 515, 170).fillAndStroke(boxBgColor, "#dfba9d");
    
    // Left Grid Side: Nominee Information
    let currentY = doc.y - 170 + 15;
    doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text("Nominee Information", 55, currentY);
    doc.moveTo(55, currentY + 18).lineTo(280, currentY + 18).strokeColor(textColor).lineWidth(1).stroke();

    doc.fontSize(10).font("Helvetica").text(`Name: ${nomination.employeeName || 'N/A'}`, 55, currentY + 30);
    doc.text(`Employee ID: ${nomination.employeeId || 'N/A'}`, 55, currentY + 55);
    doc.text(`Designation: ${nomination.designation || 'N/A'}`, 55, currentY + 80);
    doc.text(`Department/Project: ${nomination.department || 'N/A'}`, 55, currentY + 105);

    // Right Grid Side: Nominator Information
    doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text("Nominator Information", 310, currentY);
    doc.moveTo(310, currentY + 18).lineTo(535, currentY + 18).strokeColor(textColor).lineWidth(1).stroke();

    doc.fontSize(10).font("Helvetica").text(`Nominated by: ${nomination.nominatorName || 'N/A'}`, 310, currentY + 30);
    doc.text(`Nominator Dept: ${nomination.nominatorDept || 'N/A'}`, 310, currentY + 55);
    doc.text(`Nominator Desig: ${nomination.nominatorDesig || 'N/A'}`, 310, currentY + 80);
    doc.text(`Nominator Email: ${nomination.nominatorEmail || 'N/A'}`, 310, currentY + 105);

    // Jump positioning past the split row container box
    doc.y = currentY + 145;
    doc.moveDown(2);

    // 3. Award Information Section Box
    doc.rect(40, doc.y, 515, 75).fillAndStroke(boxBgColor, "#dfba9d");
    let awardY = doc.y - 75 + 12;
    doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text("Award Information", 55, awardY);
    doc.moveTo(55, awardY + 18).lineTo(535, awardY + 18).strokeColor(textColor).lineWidth(1).stroke();

    doc.fontSize(11).font("Helvetica-Bold").text(`Year of Nomination: `, 55, awardY + 30, { continued: true })
       .font("Helvetica").text(nomination.yearOfNomination || 'N/A');
    doc.font("Helvetica-Bold").text(`Award Type Selected: `, 55, awardY + 48, { continued: true })
       .font("Helvetica").text(nomination.awardType || 'N/A');

    doc.y = awardY + 70;
    doc.moveDown(2);

    // 4. Questions & Answers Section Blocks
    doc.fillColor(textColor).fontSize(15).font("Helvetica-Bold").text("📋 Questionnaire Details", 45);
    doc.moveDown(0.5);

    if (nomination.answers && nomination.answers.length > 0) {
      nomination.answers.forEach((item, index) => {
        // Prevent content overflow clipping on new pages mid-render
        if (doc.y > 700) doc.addPage();

        // Question block header style
        doc.fillColor(textColor).fontSize(11).font("Helvetica-Bold").text(`Q${index + 1}: ${item.question}`);
        doc.moveDown(0.3);

        // Answer container text box styling matching form inputs
        const textHeight = doc.heightOfString(item.answer || 'No Answer Provided', { width: 495 });
        const padding = 10;
        
        doc.rect(45, doc.y, 505, textHeight + padding).fillAndStroke(inputBgColor, "#d07e60");
        
        doc.fillColor("#ffffff")
           .font("Helvetica")
           .fontSize(10)
           .text(item.answer || 'No Answer Provided', 55, doc.y - (textHeight + padding) + 5, { width: 485 });
        
        doc.y += 15; // padding separator block
      });
    } else {
      doc.font("Helvetica-Oblique").fontSize(11).text("No custom questionnaire evaluation answers found for this user.");
    }

    // End Document Stream cleanly
    doc.end();

  } catch (err) {
    console.error("❌ Error generating PDF report file:", err);
    res.status(500).json({ error: "Failed to generate PDF document layout." });
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