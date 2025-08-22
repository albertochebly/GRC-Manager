const fs = require('fs');
const path = require('path');

// Simple Levenshtein distance implementation
function levenshtein(a, b) {
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

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
    // Normalize: lowercase, trim, collapse whitespace
    const norm = match[1].toLowerCase().replace(/\s+/g, ' ').trim();
    questions.push({ original: match[1], norm });
  }
});

const threshold = 10; // max distance for fuzzy match
const fuzzyDups = [];
for (let i = 0; i < questions.length; i++) {
  for (let j = i + 1; j < questions.length; j++) {
    const dist = levenshtein(questions[i].norm, questions[j].norm);
    if (dist > 0 && dist <= threshold) {
      fuzzyDups.push({
        q1: questions[i].original,
        q2: questions[j].original,
        distance: dist
      });
    }
  }
}

if (fuzzyDups.length === 0) {
  console.log('No near-duplicate (fuzzy) questions found.');
} else {
  console.log('Near-duplicate (fuzzy) questions:');
  fuzzyDups.forEach(({ q1, q2, distance }) => {
    console.log('---');
    console.log(`Distance: ${distance}`);
    console.log(q1);
    console.log(q2);
  });
}
