/**
 * seedAwardConfig.js
 * Run once to import existing awards.json, description.json, and scoringGuides.json
 * into the MongoDB AwardConfig collection.
 *
 * Usage: node seedAwardConfig.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AwardConfig from './models/AwardConfig.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Load static JSON files from the client/src/data folder ──
const CLIENT_DATA = join(__dirname, '..', 'client', 'src', 'data');

const awards        = JSON.parse(readFileSync(join(CLIENT_DATA, 'awards.json'),        'utf8'));
const descriptions  = JSON.parse(readFileSync(join(CLIENT_DATA, 'description.json'),  'utf8'));
const scoringGuides = JSON.parse(readFileSync(join(CLIENT_DATA, 'scoringGuides.json'), 'utf8'));

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverApi: { version: '1', strict: true, deprecationErrors: true },
      ssl: true,
      tlsAllowInvalidCertificates: true,
    });
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const [awardName, questions] of Object.entries(awards)) {
      const existing = await AwardConfig.findOne({ awardName });
      if (existing) {
        console.log(`⏭️  Skipping "${awardName}" — already exists`);
        skipped++;
        continue;
      }

      // Find description (try exact key and trimmed key)
      const descKey = Object.keys(descriptions).find(k => k.trim() === awardName.trim()) || awardName;
      const description = descriptions[descKey] || descriptions[awardName] || [];

      // Build scoring criteria from scoringGuides
      const guideKey = Object.keys(scoringGuides).find(k => k.trim() === awardName.trim()) || awardName;
      const guide = scoringGuides[guideKey] || scoringGuides[awardName] || {};
      const scoringCriteria = Object.entries(guide).map(([criterionName, descs]) => ({
        criterionName,
        weight: extractWeight(criterionName),
        descriptions: {
          5: descs['5'] || '',
          4: descs['4'] || '',
          3: descs['3'] || '',
          2: descs['2'] || '',
          1: descs['1'] || '',
        }
      }));

      // Determine eligibility from existing filter logic
      const eligibleDesignations = inferEligibility(awardName);

      const config = new AwardConfig({
        awardName,
        description,
        questions,
        scoringCriteria,
        eligibleDesignations,
        isActive: true,
      });

      await config.save();
      console.log(`✅ Created "${awardName}"`);
      created++;
    }

    console.log(`\n🎉 Seed complete: ${created} created, ${skipped} skipped`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

/** Extract numeric weight from criterion name, e.g. "(Weight: 15)" → 15 */
function extractWeight(name) {
  const match = name.match(/Weight:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

/** Infer eligible designations from the award name */
function inferEligibility(name) {
  const n = name.toLowerCase();
  if (n.includes('team awesome') || n.includes('customer service'))
    return ['manager'];
  if (n.includes('beyond the call'))
    return ['management', 'director', 'vp'];
  if (n.includes('peer appreciation') || n.includes('leadership') || n.includes('initiative'))
    return ['manager', 'management', 'avp'];
  return [];
}

seed();
