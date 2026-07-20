// Nomination.js
import mongoose from "mongoose";

const nominationSchema = new mongoose.Schema({
  employeeName: { type: String, required: true, trim: true },
  employeeId: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
  employeeEmail: { type: String, trim: true },
  yearOfNomination: { type: String, required: true, trim: true },
  awardType: { type: String, trim: true },
  justification: String,
  recommendation: String,
  nominatorName: { type: String, trim: true },
  nominatorDept: { type: String, trim: true },
  nominatorDesig: { type: String, trim: true },
  nominatorEmail: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  answers: [
    {
      question: String,
      answer: String,
    },
  ],
  scores: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Nomination = mongoose.model("Nomination", nominationSchema);
export default Nomination;
