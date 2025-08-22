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

console.log(`Total Annex A Controls found: ${annexAItems.length}`);
annexAItems.forEach((item, idx) => {
  console.log(`\n#${idx + 1}`);
  console.log(`File: ${item.file}`);
  console.log(`Control: ${item.standardRef}`);
  console.log(`Question: ${item.question}`);
});
