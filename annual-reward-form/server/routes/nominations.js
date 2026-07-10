import express from "express";
import Nomination from "../models/Nomination.js";
import PDFDocument from "pdfkit"; // 👈 Imported PDFKit
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🛠️ Reconstruct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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



router.get("/download-pdf/:employeeName", async (req, res) => {
  try {
    // 1. Fetch the latest nomination record
    const nomination = await Nomination.findOne({ employeeName: req.params.employeeName }).sort({ createdAt: -1 });

    if (!nomination) {
      return res.status(404).json({ error: "Nomination data not found for this candidate" });
    }

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

    const awardGuides = scoringGuides[nomination.awardType] || {};

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Set Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Nomination_${nomination.employeeName.replace(/\s+/g, '_')}.pdf`);
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

    // Nominee & Nominator Profiles
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

    doc.y = sectionTopY + 110;
    doc.moveDown(1.5);

    // Award Target Metadata Overview 
    const metaY = doc.y;
    doc.rect(50, metaY, 495, 45).strokeColor(borderColor).lineWidth(1).stroke();
    
    doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("Award Classification Group:", 65, metaY + 10, { continued: true })
       .font("Helvetica").fillColor("#000000").text(` ${nomination.awardType || 'N/A'}`);
       
    doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Evaluation Term / Period:", 65, metaY + 26, { continued: true })
       .font("Helvetica").fillColor("#000000").text(` ${nomination.yearOfNomination || 'N/A'}`);

    doc.y = metaY + 45;
    doc.moveDown(2);


    // ==========================================
    // SECTION A: PERFORMANCE SUMMARY / JUSTIFICATION
    // ==========================================
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("Performance Summary & Justification");
    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor(primaryColor).lineWidth(1).stroke();
    doc.moveDown(1);

    // Filter out text answers that don't start with digits (the descriptive essays)
    const textJustifications = nomination.answers.filter(item => !String(item.answer || "").match(/^\d/));

    if (textJustifications.length > 0) {
      textJustifications.forEach((item) => {
        const fieldQuestion = item.question;
        const fieldValue = item.answer || "No response provided.";
        
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
      doc.font("Helvetica-Oblique").fontSize(10).fillColor(secondaryColor).text("No qualitative performance summaries found.");
      doc.moveDown(1.5);
    }


    // ==========================================
    // SECTION B: SCORING WEIGHT GRID MATRIX REFERENCE
    // ==========================================
    doc.moveDown(1);
    if (doc.y + 100 > 740) doc.addPage();

    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("Scoring Weight Grid Reference (Total: 100)");
    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor(primaryColor).lineWidth(1).stroke();
    doc.moveDown(1);

    // Filter for answers that *do* start with digits (the score rows evaluated against matrices)
    const metricScores = nomination.answers.filter(item => String(item.answer || "").match(/^\d/));

    if (metricScores.length > 0) {
      metricScores.forEach((item, index) => {
        const questionText = `${item.question}`;
        
        const rawAnswerStr = String(item.answer || "");
        const matchedRatingMatch = rawAnswerStr.match(/^\d/);
        const selectedRating = matchedRatingMatch ? matchedRatingMatch[0] : null;

        const fieldGuideOptions = awardGuides[item.question] || {};

        // Precalculate grid layout height boundary checkpoints
        let optionsHeight = 0;
        ["5", "4", "3", "2", "1"].forEach((r) => {
          const description = fieldGuideOptions[r] || `Performance milestone reference ${r}.`;
          optionsHeight += doc.heightOfString(`[ ${r} ]  ${description}`, { width: 450 }) + 8;
        });
        const totalScoreBlockHeight = doc.heightOfString(questionText, { width: 495 }) + optionsHeight + 25;

        if (doc.y + totalScoreBlockHeight > 740) {
          doc.addPage();
        }

        // Print Objective Metric Criterion Label
        doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text(questionText, 50, doc.y, { width: 495 });
        doc.moveDown(0.6);

        // Display matrix level entries 5 down to 1
        ["5", "4", "3", "2", "1"].forEach((rating) => {
          const displayOptionText = fieldGuideOptions[rating];
          if (!displayOptionText) return; 

          const textLineString = `   [ ${rating} ]   ${displayOptionText}`;
          const isSelectedOption = rating === selectedRating;
          
          const lineY = doc.y;
          const labelHeight = doc.heightOfString(textLineString, { width: 465 });

          if (isSelectedOption) {
            // Draw square highlighted indicator border around selected string metric option
            doc.rect(60, lineY - 4, 475, labelHeight + 8)
               .strokeColor(highlightBoxColor)
               .lineWidth(1.5)
               .stroke();

            doc.fillColor(highlightBoxColor)
               .font("Helvetica-Bold")
               .fontSize(10)
               .text(textLineString, 65, lineY, { width: 460, align: "justify" });
          } else {
            doc.fillColor("#666666")
               .font("Helvetica")
               .fontSize(9.5)
               .text(textLineString, 65, lineY, { width: 460, align: "justify" });
          }

          doc.y = lineY + labelHeight;
          doc.moveDown(0.4);
        });

        doc.moveDown(1.2);
      });
    } else {
      doc.font("Helvetica-Oblique").fontSize(10).fillColor(secondaryColor).text("No matrix score selections were recorded.");
    }

    // 5. ADMINISTRATIVE USE BOX
    doc.moveDown(2);
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

    doc.end();

  } catch (err) {
    console.error("❌ Error generating organized PDF layout:", err);
    res.status(500).json({ error: "Failed to generate customized PDF template." });
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