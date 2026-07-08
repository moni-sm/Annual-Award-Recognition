import mongoose from 'mongoose';

// A single question/field in an award
const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['input', 'textarea', 'checkbox', 'section', 'scoringGuide'], required: true },
  question: { type: String },        // for input/textarea/checkbox
  title: { type: String },           // for section/scoringGuide
  placeholder: { type: String },
  options: [{ type: String }],       // for checkbox
  order: { type: Number, default: 0 }
}, { _id: true });

// A scoring criterion row: criterion title, weight, and per-rating descriptions
const scoringCriterionSchema = new mongoose.Schema({
  criterionName: { type: String, required: true },  // e.g. "Schedule adherence Rating (Weight: 15)"
  weight: { type: Number, default: 0 },
  descriptions: {
    5: { type: String, default: '' },
    4: { type: String, default: '' },
    3: { type: String, default: '' },
    2: { type: String, default: '' },
    1: { type: String, default: '' }
  }
}, { _id: true });

// Top-level award document
const awardConfigSchema = new mongoose.Schema({
  awardName: { type: String, required: true, unique: true, trim: true },
  description: [{ type: String }],   // lines of the award description
  questions: [questionSchema],       // all form questions/sections
  scoringCriteria: [scoringCriterionSchema], // scoring guide rows
  eligibleDesignations: [{ type: String }], // who can nominate (e.g. ['manager', 'director'])
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

awardConfigSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const AwardConfig = mongoose.model('AwardConfig', awardConfigSchema);
export default AwardConfig;
