const a = require('../client/src/data/maturityAssessmentData');
const b = require('../client/src/data/additionalControls');

const all = [...a.assessmentQuestions, ...b.additionalControls];
const seen = new Set();
const dups = all.filter(q => {
  if (seen.has(q.id)) {
    return true;
  }
  seen.add(q.id);
  return false;
});

if (dups.length === 0) {
  console.log('No duplicate IDs found.');
} else {
  console.log('Duplicate IDs:', dups.map(q => q.id));
  dups.forEach(q => {
    console.log(`ID: ${q.id}, Category: ${q.category}, Section: ${q.section}, Ref: ${q.standardRef}`);
  });
}
