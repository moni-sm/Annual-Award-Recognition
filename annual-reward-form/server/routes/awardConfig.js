import express from 'express';
import AwardConfig from '../models/AwardConfig.js';

const router = express.Router();

// GET all award configs (summary)
router.get('/', async (req, res) => {
  try {
    const awards = await AwardConfig.find({}, 'awardName isActive updatedAt eligibleDesignations');
    res.json(awards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch award configs', details: err.message });
  }
});

// GET full config for a single award by ID
router.get('/:id', async (req, res) => {
  try {
    const award = await AwardConfig.findById(req.params.id);
    if (!award) return res.status(404).json({ error: 'Award not found' });
    res.json(award);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch award', details: err.message });
  }
});

// GET all awards in the format the client NominationForm expects
// Returns: { questionMap, descriptions, scoringGuides, eligibleDesignations }
router.get('/export/client-format', async (req, res) => {
  try {
    const awards = await AwardConfig.find({ isActive: true });

    const questionMap = {};
    const descriptions = {};
    const scoringGuides = {};
    const eligibleDesignations = {};

    awards.forEach(award => {
      questionMap[award.awardName] = award.questions;
      descriptions[award.awardName] = award.description;
      eligibleDesignations[award.awardName] = award.eligibleDesignations || [];

      // Build scoringGuides: { awardName: { criterionName: { "5": "...", "4": "...", ... } } }
      if (award.scoringCriteria && award.scoringCriteria.length > 0) {
        scoringGuides[award.awardName] = {};
        award.scoringCriteria.forEach(sc => {
          scoringGuides[award.awardName][sc.criterionName] = sc.descriptions;
        });
      }
    });

    res.json({ questionMap, descriptions, scoringGuides, eligibleDesignations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export client format', details: err.message });
  }
});

// POST - create a new award config
router.post('/', async (req, res) => {
  try {
    const { awardName, description, questions, scoringCriteria, eligibleDesignations, isActive } = req.body;

    if (!awardName) return res.status(400).json({ error: 'awardName is required' });

    const existing = await AwardConfig.findOne({ awardName });
    if (existing) return res.status(409).json({ error: `Award "${awardName}" already exists` });

    const award = new AwardConfig({
      awardName,
      description: description || [],
      questions: questions || [],
      scoringCriteria: scoringCriteria || [],
      eligibleDesignations: eligibleDesignations || [],
      isActive: isActive !== undefined ? isActive : true
    });

    await award.save();
    res.status(201).json(award);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create award config', details: err.message });
  }
});

// PUT - update an entire award config
router.put('/:id', async (req, res) => {
  try {
    const { awardName, description, questions, scoringCriteria, eligibleDesignations, isActive } = req.body;

    const updated = await AwardConfig.findByIdAndUpdate(
      req.params.id,
      {
        awardName,
        description,
        questions,
        scoringCriteria,
        eligibleDesignations,
        isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Award not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update award config', details: err.message });
  }
});

// PATCH - toggle isActive
router.patch('/:id/toggle', async (req, res) => {
  try {
    const award = await AwardConfig.findById(req.params.id);
    if (!award) return res.status(404).json({ error: 'Award not found' });
    award.isActive = !award.isActive;
    award.updatedAt = new Date();
    await award.save();
    res.json({ isActive: award.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle award', details: err.message });
  }
});

// DELETE - remove an award config
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await AwardConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Award not found' });
    res.json({ message: 'Award deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete award', details: err.message });
  }
});

export default router;
