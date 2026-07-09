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

    // Initialize PDF document with a clean format
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Set Response Headers to download file cleanly
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Nomination_${nomination.employeeName.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // --- Formal Corporate Palette ---
    const primaryColor = "#1a1a1a";   // Dark charcoal for headers
    const secondaryColor = "#555555"; // Muted grey for subheaders/labels
    const borderColor = "#cccccc";     // Light grey for clean borders

    // 1. Document Header
    doc.fillColor(primaryColor)
       .fontSize(22)
       .font("Helvetica-Bold")
       .text("Annual Award Nomination Report", { align: "center" });
    
    doc.moveDown(0.3);
    
    // Horizontal decorative rule
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .strokeColor(primaryColor)
       .lineWidth(1.5)
       .stroke();
       
    doc.moveDown(1.5);

    // Record the current structural anchor point
    const sectionTopY = doc.y;

    // 2. Info Columns (Left Side: Nominee | Right Side: Nominator)
    // Left Side Columns
    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("NOMINEE PROFILE", 50, sectionTopY);
    doc.moveTo(50, sectionTopY + 16).lineTo(280, sectionTopY + 16).strokeColor(borderColor).lineWidth(1).stroke();
    
    doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("Name: ", 50, sectionTopY + 26, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.employeeName || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Employee ID: ", 50, sectionTopY + 44, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.employeeId || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Designation: ", 50, sectionTopY + 62, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.designation || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Department: ", 50, sectionTopY + 80, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.department || 'N/A');

    // Right Side Columns
    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("NOMINATOR PROFILE", 315, sectionTopY);
    doc.moveTo(315, sectionTopY + 16).lineTo(545, sectionTopY + 16).strokeColor(borderColor).lineWidth(1).stroke();

    doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("Submitted By: ", 315, sectionTopY + 26, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.nominatorName || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Department: ", 315, sectionTopY + 44, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.nominatorDept || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Designation: ", 315, sectionTopY + 62, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.nominatorDesig || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Email: ", 315, sectionTopY + 80, { continued: true })
       .font("Helvetica").fillColor("#000000").text(nomination.nominatorEmail || 'N/A');

    // Safe cursor positioning leap below profiles
    doc.y = sectionTopY + 110;
    doc.moveDown(1.5);

    // 3. Award Target Metadata Overview 
    const metaY = doc.y;
    doc.rect(50, metaY, 495, 45).strokeColor(borderColor).lineWidth(1).stroke();
    
    doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("Award Classification Group:", 65, metaY + 10, { continued: true })
       .font("Helvetica").fillColor("#000000").text(` ${nomination.awardType || 'N/A'}`);
       
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Evaluation Term / Period:", 65, metaY + 26, { continued: true })
       .font("Helvetica").fillColor("#000000").text(` ${nomination.yearOfNomination || 'N/A'}`);

    doc.y = metaY + 45;
    doc.moveDown(2);

    // 4. Questions & Answers Section Blocks (Dynamic Pagination Safe)
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("Evaluation & Questionnaire Details");
    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor(primaryColor).lineWidth(1).stroke();
    doc.moveDown(1);

    if (nomination.answers && nomination.answers.length > 0) {
      nomination.answers.forEach((item, index) => {
        // Calculate raw prospective line height to handle page breaking early
        const questionText = `Q${index + 1}: ${item.question}`;
        const answerText = item.answer || 'No response provided.';
        
        const estTextHeight = doc.heightOfString(questionText, { width: 495 }) + 
                             doc.heightOfString(answerText, { width: 485 }) + 40;

        // Dynamic page break evaluator
        if (doc.y + estTextHeight > 750) {
          doc.addPage();
        }

        // Output Question block header
        doc.fillColor(primaryColor)
           .fontSize(10)
           .font("Helvetica-Bold")
           .text(questionText, 50, doc.y, { width: 495 });
        doc.moveDown(0.4);

        // Layout dynamic text content wrapped by a formal left-bordered accent wall
        const startAnswerY = doc.y;
        doc.fillColor("#222222")
           .font("Helvetica")
           .fontSize(10)
           .text(answerText, 62, startAnswerY, { width: 483, align: "justify" });
        
        const endAnswerY = doc.y;

        // Vertical left-accent bracket margin indicator bar
        doc.moveTo(53, startAnswerY - 2)
           .lineTo(53, endAnswerY + 2)
           .strokeColor(borderColor)
           .lineWidth(2)
           .stroke();

        doc.y = endAnswerY;
        doc.moveDown(1.2);
      });
    } else {
      doc.font("Helvetica-Oblique").fontSize(11).fillColor(secondaryColor).text("No custom questionnaire evaluation metrics found.");
    }

    // 5. ✍️ ADMIN BOX: Empty Total Reviewed Score Box
    doc.moveDown(2);
    
    // Ensure box doesn't break cleanly across margins incorrectly
    if (doc.y + 90 > 750) {
      doc.addPage();
    }

    const finalScoreY = doc.y;
    
    // Draw outer section container block
    doc.rect(50, finalScoreY, 495, 60)
       .fillAndStroke("#fafafa", "#a0a0a0")
       .lineWidth(1);

    // Section Label Title
    doc.fillColor(primaryColor)
       .font("Helvetica-Bold")
       .fontSize(11)
       .text("ADMINISTRATIVE USE ONLY", 65, finalScoreY + 24);

    // Text prefix for the score field
    doc.fillColor("#333333")
       .font("Helvetica-Bold")
       .fontSize(12)
       .text("TOTAL REVIEWED SCORE:", 265, finalScoreY + 24, { align: "right", width: 180 });

    // 🔳 Empty form box for writing/typing the score
    const boxWidth = 70;
    const boxHeight = 34;
    const boxX = 455;
    const boxY = finalScoreY + 13;

    doc.rect(boxX, boxY, boxWidth, boxHeight)
       .fillAndStroke("#ffffff", primaryColor)
       .lineWidth(1.5);

    // Cleanly finalize PDF stream
    doc.end();

  } catch (err) {
    console.error("❌ Error generating formal PDF report:", err);
    res.status(500).json({ error: "Failed to generate professional PDF layout." });
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