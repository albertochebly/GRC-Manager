const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../client/src/data/maturityAssessmentData.ts'),
  path.join(__dirname, '../client/src/data/additionalControls.ts'),
];

const questionRegex = /question:\s*"([^"]+)"/g;
const questions = [];
const questionMap = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    // Normalize: lowercase, trim, collapse whitespace
    const norm = match[1].toLowerCase().replace(/\s+/g, ' ').trim();
    questions.push(norm);
    if (!questionMap[norm]) questionMap[norm] = [];
    questionMap[norm].push(match[1]);
  }
});

const seen = new Set();
const dups = questions.filter(q => {
  if (seen.has(q)) {
    return true;
  }
  seen.add(q);
  return false;
});

if (dups.length === 0) {
  console.log('No duplicate questions found.');
} else {
  console.log('Duplicate questions (normalized):');
  dups.forEach(q => {
    console.log('---');
    questionMap[q].forEach(orig => console.log(orig));
  });
}
