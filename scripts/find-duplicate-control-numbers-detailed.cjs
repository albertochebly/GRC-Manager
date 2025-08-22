const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../client/src/data/maturityAssessmentData.ts'),
  path.join(__dirname, '../client/src/data/additionalControls.ts'),
];

const refRegex = /standardRef:\s*"([^"]+)"/g;
const refs = [];
const refDetails = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = refRegex.exec(content)) !== null) {
    const ref = match[1].trim();
    refs.push(ref);
    if (!refDetails[ref]) refDetails[ref] = [];
    // Extract the full question for context
    const questionMatch = new RegExp(`standardRef:\\s*"${ref}"[\s\S]*?question:\\s*"([^"]+)"`).exec(content);
    const question = questionMatch ? questionMatch[1] : '';
    refDetails[ref].push({ file, question });
  }
});

const seen = new Set();
const dups = refs.filter(ref => {
  if (seen.has(ref)) {
    return true;
  }
  seen.add(ref);
  return false;
});

if (dups.length === 0) {
  console.log('No duplicate control numbers (standardRef) found.');
} else {
  console.log('Duplicate control numbers (standardRef):', dups);
  dups.forEach(ref => {
    console.log(`\nControl: ${ref}`);
    refDetails[ref].forEach(({ file, question }) => {
      console.log(`  - File: ${file}`);
      console.log(`    Question: ${question}`);
    });
  });
}
