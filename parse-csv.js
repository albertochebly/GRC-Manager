import fs from 'fs';
import path from 'path';

// Read the CSV file
const csvContent = fs.readFileSync('ISO27001 - GAP assessment questions.csv', 'utf-8');
const lines = csvContent.trim().split('\n');

// Parse CSV lines
const questions = [];
let id = 1;

lines.forEach(line => {
  // Simple CSV parsing - split by comma but handle quoted strings
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  
  if (parts.length >= 4) {
    const [category, section, standardRef, question] = parts;
    
    questions.push({
      id: id++,
      category: category.replace(/"/g, ''),
      section: section.replace(/"/g, ''),
      standardRef: standardRef.replace(/"/g, ''),
      question: question.replace(/"/g, ''),
      currentMaturityLevel: "0",
      currentMaturityScore: 0,
      currentComments: "",
      targetMaturityLevel: "0",
      targetMaturityScore: 0,
      targetComments: ""
    });
  }
});

// Generate the TypeScript file content
const tsContent = `// ISO 27001 Comprehensive Maturity Assessment Data
export const assessmentQuestions = ${JSON.stringify(questions, null, 2)};

// Maturity levels with descriptions
export const maturityLevels = [
  { value: "0", label: "0 – Not Defined", score: 0, description: "Control is not implemented or defined.", color: "bg-red-100 text-red-800" },
  { value: "1", label: "1 – Yes, but ad hoc", score: 1, description: "Policies, procedures, and strategies are not formalized; activities are performed in an ad-hoc, reactive manner.", color: "bg-orange-100 text-orange-800" },
  { value: "2", label: "2 – Yes, documented but inconsistent", score: 2, description: "Policies, procedures, and strategies are formalized and documented but not consistently implemented.", color: "bg-yellow-100 text-yellow-800" },
  { value: "3", label: "3 – Yes, Consistent but no metrics", score: 3, description: "Policies, procedures, and strategies are consistently implemented, but quantitative and qualitative effectiveness measures are lacking.", color: "bg-blue-100 text-blue-800" },
  { value: "4", label: "4 - Yes, measured & managed", score: 4, description: "Quantitative and qualitative measures on the effectiveness of policies, procedures, and strategies are collected across the organization and used to assess them and make necessary changes.", color: "bg-green-100 text-green-800" },
  { value: "5", label: "5- Yes, Optimizing & continually improved", score: 5, description: "Policies, procedures, and strategies are fully institutionalized, repeatable, self-generating, and regularly updated based on a changing threat and technology landscape and business/mission needs.", color: "bg-purple-100 text-purple-800" },
  { value: "NA", label: "NA - Not Applicable", score: 0, description: "The requirement is not applicable to the organization.", color: "bg-gray-100 text-gray-800" }
];`;

// Write the TypeScript file
fs.writeFileSync('client/src/data/maturityAssessmentData.ts', tsContent);

console.log(`Generated ${questions.length} questions from CSV file.`);
console.log('File saved to: client/src/data/maturityAssessmentData.ts');
