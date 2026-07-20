import express from "express";
import Nomination from "../models/Nomination.js";
import PDFDocument from "pdfkit";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Parser } from 'json2csv';
import * as archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Helper to sanitize text encoding artifacts
const cleanText = (str) => String(str || "").replace(/&nbsp;?/g, " ").replace(/&amp;?/g, "&").trim();

// Helper to safely load scoring guide JSON matrix structures
const loadScoringGuides = () => {
  try {
    const jsonPath = path.join(__dirname, '../../client/src/data/scoringGuides.json');
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
  } catch (err) {
    console.error("⚠️ Could not read scoringGuides.json:", err.message);
  }
  return {};
};


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
 
 
// ✅ GET Nomination Stats
router.get("/stats", async (req, res) => {
  try {
    // 1. Calculate general counts
    const totalNominations = await Nomination.countDocuments();
   
    // 2. Count statuses explicitly
    const approvedCount = await Nomination.countDocuments({ status: "approved" });
    const rejectedCount = await Nomination.countDocuments({ status: "rejected" });
   
    // 3. Count unique nominees who are pending, approved, or rejected
    const statsByAward = await Nomination.aggregate([
      { $group: { _id: "$awardType", count: { $sum: 1 } } }
    ]);
 
    res.status(200).json({
      totalNominations,
      approved: approvedCount,
      rejected: rejectedCount,
      statsByAward
    });
  } catch (err) {
    console.error("❌ Error fetching nomination stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
 
router.patch("/status", async (req, res) => {
  const { nominationId, status } = req.body;
 
  if (!nominationId) {
    return res.status(400).json({ error: "Missing required field: nominationId" });
  }
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }
 
  try {
    const updatedNomination = await Nomination.findByIdAndUpdate(
      nominationId,
      { status: status },
      { new: true, runValidators: true }
    );
 
    if (!updatedNomination) {
      return res.status(404).json({ error: "No nomination form found with this ID" });
    }
 
    return res.status(200).json({
      message: `Status successfully updated to ${status}`,
      data: updatedNomination
    });
 
  } catch (error) {
    console.error("Database update error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
// ✅ GET Export ONLY Approved Nominations as Excel (CSV)
router.get('/download/all', async (req, res) => {
  try {
    // Filter only approved nominations
    const nominations = await Nomination.find({ status: 'approved' }).lean();

    if (!nominations || nominations.length === 0) {
      return res.status(404).json({ message: "No approved nominations found to export." });
    }

    // Flatten data for Excel readability
    const flattenedData = nominations.map(n => ({
      Employee_Name: n.employeeName,
      Employee_ID: n.employeeId,
      Department: n.department,
      Designation: n.designation,
      Award_Type: n.awardType,
      Year: n.yearOfNomination,
      Nominator: n.nominatorName,
      Nominator_Email: n.nominatorEmail,
      Status: n.status,
      Submitted_At: n.createdAt,
      // Map answers to columns if needed, or join them
      Justifications: n.answers.map(a => `${a.question}: ${a.answer}`).join(" | ")
    }));

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(flattenedData);

    // Set headers for file download
    res.header('Content-Type', 'text/csv');
    res.attachment('Approved_Nominations_Export.csv');
    
    return res.send(csv);

  } catch (error) {
    console.error('Error exporting nominations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =========================================================================
// 📄 PDF 1: EXCLUSIVELY FOR NOMINATION COMPONENT (Single Form Submission Report)
// =========================================================================
router.get("/download-pdf/id/:id", async (req, res) => {
  try {
    const nomination = await Nomination.findById(req.params.id);
    if (!nomination) return res.status(404).json({ error: "Nomination not found." });

    const scoringGuides = loadScoringGuides();
    const awardKey = Object.keys(scoringGuides).find(k => k.trim() === String(nomination.awardType).trim());
    const awardGuides = awardKey ? scoringGuides[awardKey] : {};

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Nomination_Receipt_${nomination.employeeName.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Header Styling
    doc.fillColor("#1a1a1a").fontSize(20).font("Helvetica-Bold").text("Nomination Submission Receipt", { align: "center" });
    doc.moveDown(0.2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#1a1a1a").lineWidth(1.5).stroke();
    doc.moveDown(1);

    // Nominee / Nominator Grid Layout Metadata
    doc.fontSize(10).fillColor("#555555");
    doc.font("Helvetica-Bold").text("Candidate Target: ", { continued: true }).font("Helvetica").fillColor("#000").text(nomination.employeeName);
    doc.font("Helvetica-Bold").fillColor("#555555").text("Designation/Dept: ", { continued: true }).font("Helvetica").fillColor("#000").text(`${nomination.designation} / ${nomination.department}`);
    doc.font("Helvetica-Bold").fillColor("#555555").text("Award Category: ", { continued: true }).font("Helvetica").fillColor("#000").text(nomination.awardType);
    doc.font("Helvetica-Bold").fillColor("#555555").text("Submitted By: ", { continued: true }).font("Helvetica").fillColor("#000").text(`${nomination.nominatorName} (${nomination.nominatorEmail})`);
    
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ccc").lineWidth(1).stroke();
    doc.moveDown(1);

    // Form Justifications Narrative Text
    doc.fillColor("#1a1a1a").fontSize(12).font("Helvetica-Bold").text("Justification Responses");
    doc.moveDown(0.5);

    nomination.answers.forEach((item) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#333").text(item.question);
      doc.font("Helvetica").fillColor("#555").text(cleanText(item.answer), { align: "justify", indent: 10 });
      doc.moveDown(0.8);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "Failed to build Nomination receipt PDF." });
  }
});

// =========================================================================
// 📊 PDF 2: EXCLUSIVELY FOR ADMIN DASHBOARD (Consolidated Global Metrics Report)
// =========================================================================
// GET: Generate a consolidated PDF report for a specific employee & award type
router.get("/download-pdf/:employeeName", async (req, res) => {
  try {
    const { employeeName } = req.params;
    const { awardType } = req.query; // Grouping context safely retrieved via query param

    // 1. Fetch ALL matching nomination records to consolidate multi-nominator data
    const query = { employeeName };
    if (awardType) {
      query.awardType = awardType;
    }

    const nominations = await Nomination.find(query).sort({ createdAt: -1 });

    if (!nominations || nominations.length === 0) {
      return res.status(404).json({ error: "Nomination data not found for this candidate" });
    }

    // Use the latest submission entry as the base profile identity metadata reference
    const baseProfile = nominations[0];

    // 2. 📁 Dynamic File System Lookup for Scoring Guides
    let scoringGuides = {};
    try {
      const jsonPath = path.join(__dirname, '../../client/src/data/scoringGuides.json');
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      scoringGuides = JSON.parse(rawData);
    } catch (fileErr) {
      console.error("⚠️ Could not read client scoringGuides.json file:", fileErr.message);
      scoringGuides = {};
    }

    const awardKey = Object.keys(scoringGuides).find(
      key => key.trim() === String(baseProfile.awardType).trim()
    );

    const awardGuides = awardKey ? scoringGuides[awardKey] : {};
    console.log("Award Type:", baseProfile.awardType);
    console.log("Award Key:", awardKey);
    console.log("Guide:", awardGuides);

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Set Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Consolidated_Nomination_${baseProfile.employeeName.replace(/\s+/g, '_')}.pdf`
    );
    doc.pipe(res);

    // --- Formal Corporate Palette ---
    const primaryColor = "#1a1a1a";
    const secondaryColor = "#555555";
    const borderColor = "#cccccc";
    const highlightBoxColor = "#2e7d32";

    // Document Header
    doc.fillColor(primaryColor)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("Annual Award Nomination Report", { align: "center" });

    doc.moveDown(0.3);

    doc.moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(primaryColor)
      .lineWidth(1.5)
      .stroke();

    doc.moveDown(1.5);

    const sectionTopY = doc.y;

    // Nominee Profile (Static core profile metadata block)
    doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("NOMINEE PROFILE", 50, sectionTopY);
    doc.moveTo(50, sectionTopY + 16).lineTo(545, sectionTopY + 16).strokeColor(borderColor).lineWidth(1).stroke();

    doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("Name: ", 50, sectionTopY + 26, { continued: true })
      .font("Helvetica").fillColor("#000000").text(baseProfile.employeeName || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Employee ID: ", 50, sectionTopY + 44, { continued: true })
      .font("Helvetica").fillColor("#000000").text(baseProfile.employeeId || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Designation: ", 50, sectionTopY + 62, { continued: true })
      .font("Helvetica").fillColor("#000000").text(baseProfile.designation || 'N/A');
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Department: ", 50, sectionTopY + 80, { continued: true })
      .font("Helvetica").fillColor("#000000").text(baseProfile.department || 'N/A');

    // Award Target Metadata Overview
    doc.y = sectionTopY + 105;
    const metaY = doc.y;
    doc.rect(50, metaY, 495, 45).strokeColor(borderColor).lineWidth(1).stroke();

    doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("Award Classification Group:", 65, metaY + 10, { continued: true })
      .font("Helvetica").fillColor("#000000").text(` ${baseProfile.awardType || 'N/A'}`);

    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Evaluation Term / Total Submissions:", 65, metaY + 26, { continued: true })
      .font("Helvetica").fillColor("#000000").text(` ${baseProfile.yearOfNomination || 'N/A'} (${nominations.length} Form entries)`);

    doc.y = metaY + 45;
    doc.moveDown(2);

    // Helper to sanitize broken HTML entity fragments from the string data
    const cleanText = (str) => String(str || "").replace(/&nbsp;?/g, " ").replace(/&amp;?/g, "&").trim();

    // Iteratively loop and print out every nominator response form bundled under this target row
    nominations.forEach((nomination, recordIndex) => {
      // Every submission entry after the first always starts on a fresh page.
      if (recordIndex > 0) {
        doc.addPage();
      } else if (doc.y + 120 > 740) {
        doc.addPage();
      }

      // Sub-header identifying the specific nominator
      doc.fillColor(highlightBoxColor).fontSize(12).font("Helvetica-Bold")
        .text(`SUBMISSION ENTRY #${recordIndex + 1} — Nominator: ${nomination.nominatorName || "Anonymous"}`);

      doc.fillColor(secondaryColor).fontSize(9.5).font("Helvetica-Oblique")
        .text(`Dept: ${nomination.nominatorDept || "N/A"} | Role: ${nomination.nominatorDesig || "N/A"} | Date: ${new Date(nomination.createdAt).toLocaleDateString()}`);

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(borderColor).lineWidth(1).stroke();
      doc.moveDown(1);

      // SECTION A: PERFORMANCE SUMMARY / JUSTIFICATION
      // Exclude scoring/rating questions entirely from the narrative section
      // ==========================================
      const textJustifications = nomination.answers.filter(item => {
        const question = String(item.question || "");
        const answer = String(item.answer || "");
        
        return (
          !answer.match(/^\d/) && 
          !question.match(/rating/i) &&
          !question.match(/weight/i) && // 👈 ADDED: Explicitly strips out empty weight wrappers
          !Object.keys(awardGuides).some(guideQuestion => guideQuestion.trim() === question.trim())
        );
      });

doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold")
  .text("Performance Summary / Justification", 50, doc.y, { underline: true });
doc.moveDown(0.6);

if (textJustifications.length > 0) {
  textJustifications.forEach((item) => {
    const fieldQuestion = item.question;
    const fieldValue = cleanText(item.answer || "No response provided.");

    const blockHeight = doc.heightOfString(fieldQuestion, { width: 495 }) + doc.heightOfString(fieldValue, { width: 480 }) + 30;
    if (doc.y + blockHeight > 740) doc.addPage();

    doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text(fieldQuestion, 50, doc.y, { width: 495 });
    doc.moveDown(0.4);

    const startTextY = doc.y;
    doc.fillColor("#222222").font("Helvetica").fontSize(10).text(fieldValue, 62, startTextY, { width: 483, align: "justify" });
    const endTextY = doc.y;

    doc.moveTo(53, startTextY - 2).lineTo(53, endTextY + 2).strokeColor(borderColor).lineWidth(2).stroke();
    doc.y = endTextY;
    doc.moveDown(1.2);
  });
} else {
  doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(secondaryColor).text("No qualitative narrative justifications found in this entry.");
  doc.moveDown(1);
}


      doc.moveDown(2);
    });

    // ==========================================
    // SECTION B: REVIEWER SCORING SHEET
    // ==========================================

    if (Object.keys(awardGuides).length > 0) {

      doc.fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Reviewer Scoring Sheet", 50, doc.y, { // Explicitly set X to 50
          underline: true,
        });

      doc.moveDown();

      Object.entries(awardGuides).forEach(([criteria, details]) => {

        if (doc.y > 650) {
          doc.addPage();
        }

        // Extract weight from the criteria title
        const weightMatch = criteria.match(/\(Weight:\s*(\d+)\)/i);
        const weight = weightMatch ? weightMatch[1] : "";

        const criteriaTitle = criteria.replace(/\s*\(Weight:\s*\d+\)/i, "");

        const startY = doc.y;

        // Left side - Criteria & Weight
        doc.fillColor(primaryColor)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(`Criteria : ${criteriaTitle}`, 50, startY, {
            width: 310
          });

        doc.font("Helvetica")
          .fontSize(10)
          .fillColor("#000")
          .text(`Weight : ${weight}`, 50, startY + 22);

        // Right side - Reviewer Box
        doc.font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(primaryColor)
          .text("Reviewer's Rating", 395, startY);

        doc.rect(430, startY + 18, 70, 28)
          .strokeColor("#000")
          .lineWidth(1)
          .stroke();

        // CRITICAL FIX: Move cursor below the box AND reset X back to left margin (50)
        doc.text("", 50, startY + 60);

        doc.font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(primaryColor)
          .text("Rating Scale");

        doc.moveDown(0.2);

        ["5", "4", "3", "2", "1"].forEach((rating) => {
          doc.font("Helvetica")
            .fontSize(9.5)
            .fillColor("#444")
            .text(`${rating}. ${cleanText(details[rating])}`, {
              indent: 20,
              width: 495 // Expanded width to span across the page nicely
            });
        });

        doc.moveDown(0.8);

        doc.moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .strokeColor("#dddddd")
          .lineWidth(1)
          .stroke();

        doc.moveDown(1.2);

      });
    }

    // 5. ADMINISTRATIVE USE BOX
    if (doc.y + 90 > 750) {
      doc.addPage();
    }

    const finalScoreY = doc.y;
    doc.rect(50, finalScoreY, 495, 60)
      .fillAndStroke("#fafafa", "#a0a0a0")
      .lineWidth(1);

    doc.fillColor(primaryColor)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("ADMINISTRATIVE USE ONLY", 65, finalScoreY + 24);

    doc.fillColor("#333333")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("TOTAL REVIEWED SCORE:", 265, finalScoreY + 24, { align: "right", width: 180 });

    const boxWidth = 70;
    const boxHeight = 34;
    const boxX = 455;
    const boxY = finalScoreY + 13;

    doc.rect(boxX, boxY, boxWidth, boxHeight)
      .fillAndStroke("#ffffff", primaryColor)
      .lineWidth(1.5);

    // Render total score out dynamically inside the boxed viewport area
    const displayScoreValue = String(baseProfile.totalScore || baseProfile.score || " ");
    doc.fillColor(highlightBoxColor)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(displayScoreValue, boxX, boxY + 10, { width: boxWidth, align: "center" });

    doc.end();

  } catch (err) {
    console.error("❌ Error generating organized PDF layout:", err);
    res.status(500).json({ error: "Failed to generate customized PDF template." });
  }
});


// =========================================================================
// 🗜️ PDF 3: BULK ZIP ARCHIVE ROUTE FOR APPROVED NOMINATIONS
// =========================================================================
router.get("/download-bulk-archive", async (req, res) => {
  try {
    const { division, awardType } = req.query;

    // 1. Build dynamic match parameters based on active workspace dashboard filters
    const query = { status: "approved" };
    if (division) query.department = new RegExp(`^${division}$`, 'i');
    if (awardType) query.awardType = new RegExp(`^${awardType}$`, 'i');

    const nominations = await Nomination.find(query).sort({ createdAt: -1 });

    if (!nominations || nominations.length === 0) {
      return res.status(404).json({ error: "No approved nomination data records found matching these criteria." });
    }

    // 2. Group document structures cleanly by employee + awardType to mimic frontend's uniqueness contract
    const recordsMap = new Map();
    nominations.forEach(n => {
      const compositeKey = `${n.employeeName}_${n.awardType}`;
      if (!recordsMap.has(compositeKey)) {
        recordsMap.set(compositeKey, []);
      }
      recordsMap.get(compositeKey).push(n);
    });

    // 3. Setup Response headers for compressed attachment streaming
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=Approved_Nominations_Archive.zip');

    // 4. Initialize Archiver Stream Pipeline
    const archive = archiver('zip', { zlib: { level: 5 } });
    
    // Direct archive stream straight to response pipeline outflux
    archive.pipe(res);

    const scoringGuides = loadScoringGuides();

    // 5. Generate and pack PDFs inline into the zip stream array structure
    for (const [key, matchingEntries] of recordsMap.entries()) {
      const baseProfile = matchingEntries[0];
      
      const awardKey = Object.keys(scoringGuides).find(
        k => k.trim() === String(baseProfile.awardType).trim()
      );
      const awardGuides = awardKey ? scoringGuides[awardKey] : {};

      // Initialize a standalone PDFKit Instance per distinct record entry
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      // Create internal virtual read-buffer streams for Archiver absorption
      archive.append(doc, { 
        name: `${baseProfile.employeeName.replace(/\s+/g, '_')}_${baseProfile.awardType.replace(/\s+/g, '_')}_Report.pdf` 
      });

      // --- PDF Construction Engine (Identical formatting to your single endpoint) ---
      doc.fillColor("#1a1a1a").fontSize(22).font("Helvetica-Bold").text("Annual Award Nomination Report", { align: "center" });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#1a1a1a").lineWidth(1.5).stroke();
      doc.moveDown(1.5);

      const sectionTopY = doc.y;
      doc.fillColor("#1a1a1a").fontSize(12).font("Helvetica-Bold").text("NOMINEE PROFILE", 50, sectionTopY);
      doc.moveTo(50, sectionTopY + 16).lineTo(545, sectionTopY + 16).strokeColor("#cccccc").lineWidth(1).stroke();

      doc.fillColor("#555555").fontSize(10).font("Helvetica-Bold").text("Name: ", 50, sectionTopY + 26, { continued: true }).font("Helvetica").fillColor("#000000").text(baseProfile.employeeName || 'N/A');
      doc.fillColor("#555555").font("Helvetica-Bold").text("Employee ID: ", 50, sectionTopY + 44, { continued: true }).font("Helvetica").fillColor("#000000").text(baseProfile.employeeId || 'N/A');
      doc.fillColor("#555555").font("Helvetica-Bold").text("Designation: ", 50, sectionTopY + 62, { continued: true }).font("Helvetica").fillColor("#000000").text(baseProfile.designation || 'N/A');
      doc.fillColor("#555555").font("Helvetica-Bold").text("Department: ", 50, sectionTopY + 80, { continued: true }).font("Helvetica").fillColor("#000000").text(baseProfile.department || 'N/A');

      doc.y = sectionTopY + 105;
      const metaY = doc.y;
      doc.rect(50, metaY, 495, 45).strokeColor("#cccccc").lineWidth(1).stroke();
      doc.fillColor("#555555").fontSize(10).font("Helvetica-Bold").text("Award Classification Group:", 65, metaY + 10, { continued: true }).font("Helvetica").fillColor("#000000").text(` ${baseProfile.awardType || 'N/A'}`);
      doc.fillColor("#555555").font("Helvetica-Bold").text("Evaluation Term / Total Submissions:", 65, metaY + 26, { continued: true }).font("Helvetica").fillColor("#000000").text(` ${baseProfile.yearOfNomination || 'N/A'} (${matchingEntries.length} Form entries)`);

      doc.y = metaY + 45;
      doc.moveDown(2);

      matchingEntries.forEach((nomination, recordIndex) => {
        if (recordIndex > 0 || doc.y + 120 > 740) doc.addPage();

        doc.fillColor("#2e7d32").fontSize(12).font("Helvetica-Bold").text(`SUBMISSION ENTRY #${recordIndex + 1} — Nominator: ${nomination.nominatorName || "Anonymous"}`);
        doc.fillColor("#555555").fontSize(9.5).font("Helvetica-Oblique").text(`Dept: ${nomination.nominatorDept || "N/A"} | Role: ${nomination.nominatorDesig || "N/A"} | Date: ${new Date(nomination.createdAt).toLocaleDateString()}`);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").lineWidth(1).stroke();
        doc.moveDown(1);

        const textJustifications = nomination.answers.filter(item => {
          const question = String(item.question || "");
          const answer = String(item.answer || "");
          return (!answer.match(/^\d/) && !question.match(/rating/i) && !question.match(/weight/i) && !Object.keys(awardGuides).some(gQ => gQ.trim() === question.trim()));
        });

        doc.fillColor("#1a1a1a").fontSize(11).font("Helvetica-Bold").text("Performance Summary / Justification", 50, doc.y, { underline: true });
        doc.moveDown(0.6);

        if (textJustifications.length > 0) {
          textJustifications.forEach((item) => {
            const blockHeight = doc.heightOfString(item.question, { width: 495 }) + doc.heightOfString(cleanText(item.answer), { width: 480 }) + 30;
            if (doc.y + blockHeight > 740) doc.addPage();

            doc.fillColor("#1a1a1a").fontSize(10).font("Helvetica-Bold").text(item.question, 50, doc.y, { width: 495 });
            doc.moveDown(0.4);
            doc.fillColor("#222222").font("Helvetica").fontSize(10).text(cleanText(item.answer || "No response provided."), 62, doc.y, { align: "justify", width: 475 });
            doc.moveDown(1);
          });
        } else {
          doc.fillColor("#555555").font("Helvetica-Oblique").fontSize(10).text("No text-based justifications were submitted.");
          doc.moveDown(1);
        }
      });

      // Finalize individual PDF document frame compilation loop
      doc.end();
    }

    // Finalize total compressed output folder construction structures
    await archive.finalize();

  } catch (err) {
    console.error("❌ Zip Archive Engine failure:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to assemble unified package download asset zip archive." });
    }
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

// Existing boilerplate configuration hooks...
export default router;