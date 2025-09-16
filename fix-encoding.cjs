const fs = require('fs');

const filePath = 'client/src/data/pciDssAssessmentData.ts';

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing encoding issues...');
// Replace the malformed bullet character with proper bullet point
content = content.replace(/€¢/g, '•');

console.log('Writing file back...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ All encoding issues fixed!');
console.log('Replaced all €¢ characters with proper bullet points •');