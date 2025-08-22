const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../client/src/data/maturityAssessmentData.ts'),
  path.join(__dirname, '../client/src/data/additionalControls.ts'),
];

const idRegex = /id:\s*(\d+)/g;
const ids = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    ids.push(Number(match[1]));
  }
});

const seen = new Set();
const dups = ids.filter(id => {
  if (seen.has(id)) {
    return true;
  }
  seen.add(id);
  return false;
});

if (dups.length === 0) {
  console.log('No duplicate IDs found.');
} else {
  console.log('Duplicate IDs:', dups);
}
