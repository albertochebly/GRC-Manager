const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../client/src/data/maturityAssessmentData.ts'),
  path.join(__dirname, '../client/src/data/additionalControls.ts'),
];

const itemRegex = /{[\s\S]*?category:\s*"([^"]+)"[\s\S]*?standardRef:\s*"([^"]+)"[\s\S]*?question:\s*"([^"]+)"[\s\S]*?}/g;
const annexAItems = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = itemRegex.exec(content)) !== null) {
    const category = match[1].trim();
    const standardRef = match[2].trim();
    const question = match[3].trim();
    if (category === 'Annex A Controls') {
      annexAItems.push({ standardRef, question, file });
    }
  }
});

// Find duplicates by control number
const seen = new Map();
const dups = [];
annexAItems.forEach(item => {
  if (seen.has(item.standardRef)) {
    dups.push({
      control: item.standardRef,
      question1: seen.get(item.standardRef).question,
      file1: seen.get(item.standardRef).file,
      question2: item.question,
      file2: item.file
    });
  } else {
    seen.set(item.standardRef, item);
  }
});

console.log(`Total Annex A Controls found: ${annexAItems.length}`);
console.log(`Total duplicates found: ${dups.length}`);
dups.forEach((dup, idx) => {
  console.log(`\nDuplicate #${idx + 1}`);
  console.log(`Control: ${dup.control}`);
  console.log(`File 1: ${dup.file1}`);
  console.log(`Question 1: ${dup.question1}`);
  console.log(`File 2: ${dup.file2}`);
  console.log(`Question 2: ${dup.question2}`);
});
