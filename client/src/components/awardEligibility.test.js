import test from 'node:test';
import assert from 'node:assert/strict';
import { getEligibleAwards } from './awardEligibility.js';

test('returns leadership awards for managerial designations', () => {
  const awards = getEligibleAwards('CKONNECT (Product Sales & Technical Enablement)', 'Senior Manager');

  assert.ok(awards.includes('Outstanding Leadership Award'));
  assert.ok(awards.includes('Sales Champion Award'));
});

test('returns customer-focused awards for service divisions', () => {
  const awards = getEligibleAwards('LightLeader Solar (Installation & Support Services)', 'Customer Support Executive');

  assert.ok(awards.includes('Customer Service Performance / Star Service Champion / Customer Hero Award'));
  assert.ok(awards.includes('Customer Delight Award'));
});

test('returns admin-oriented awards for administrative roles', () => {
  const awards = getEligibleAwards('Conceptia Business Enablers', 'Administrative Assistant');

  assert.ok(awards.includes('Administrative Excellence Award'));
  assert.ok(awards.includes('Spotlight Award'));
});

test('keeps universal awards available for any designation', () => {
  const awards = getEligibleAwards('Conceptia Marine', 'Intern');

  assert.ok(awards.includes('Spotlight Award'));
  assert.ok(awards.includes('Top Performance Award'));
});
