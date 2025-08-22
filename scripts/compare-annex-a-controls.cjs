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

// Official ISO 27001:2022 Annex A control numbers
const officialAnnexA = [
  'Control-5.1','Control-5.2','Control-5.3','Control-5.4','Control-5.5','Control-5.6','Control-5.7','Control-5.8','Control-5.9','Control-5.10','Control-5.11','Control-5.12','Control-5.13','Control-5.14','Control-5.15','Control-5.16','Control-5.17','Control-5.18','Control-5.19','Control-5.20','Control-5.21','Control-5.22','Control-5.23','Control-5.24','Control-5.25','Control-5.26','Control-5.27','Control-5.28','Control-5.29','Control-5.30','Control-5.31','Control-5.32','Control-5.33','Control-5.34','Control-5.35','Control-5.36','Control-5.37',
  'Control-6.1','Control-6.2','Control-6.3','Control-6.4','Control-6.5','Control-6.6','Control-6.7','Control-6.8',
  'Control-7.1','Control-7.2','Control-7.3','Control-7.4','Control-7.5','Control-7.6','Control-7.7','Control-7.8','Control-7.9','Control-7.10','Control-7.11',
  'Control-8.1','Control-8.2','Control-8.3','Control-8.4','Control-8.5','Control-8.6','Control-8.7','Control-8.8','Control-8.9','Control-8.10','Control-8.11','Control-8.12','Control-8.13','Control-8.14','Control-8.15','Control-8.16','Control-8.17','Control-8.18','Control-8.19','Control-8.20','Control-8.21','Control-8.22','Control-8.23','Control-8.24','Control-8.25','Control-8.26','Control-8.27','Control-8.28','Control-8.29','Control-8.30','Control-8.31','Control-8.32','Control-8.33','Control-8.34'
];

const foundControls = annexAItems.map(item => item.standardRef);
const missing = officialAnnexA.filter(ref => !foundControls.includes(ref));
const extra = foundControls.filter(ref => !officialAnnexA.includes(ref));

console.log(`Total Annex A Controls found: ${annexAItems.length}`);
console.log(`Official Annex A Controls: ${officialAnnexA.length}`);
console.log(`\nMissing official controls:`);
missing.forEach(ref => console.log(ref));
console.log(`\nExtra controls in your data:`);
extra.forEach(ref => console.log(ref));
