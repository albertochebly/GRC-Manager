const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../client/src/data/maturityAssessmentData.ts'),
  path.join(__dirname, '../client/src/data/additionalControls.ts'),
];

const refRegex = /standardRef:\s*"([^"]+)"/g;
const refs = [];
const refMap = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = refRegex.exec(content)) !== null) {
    const ref = match[1].trim();
    refs.push(ref);
    if (!refMap[ref]) refMap[ref] = [];
    refMap[ref].push(file);
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
    console.log(`Control: ${ref} found in:`);
    refMap[ref].forEach(file => console.log(`  - ${file}`));
  });
}
