const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../client/src/data/maturityAssessmentData.ts'),
  path.join(__dirname, '../client/src/data/additionalControls.ts'),
];

const questionRegex = /question:\s*"([^"]+)"/g;
const questions = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    questions.push(match[1]);
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
  console.log('Duplicate questions:');
  dups.forEach(q => console.log(q));
}
