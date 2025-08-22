import { assessmentQuestions } from "../client/src/data/maturityAssessmentData";
import { additionalControls } from "../client/src/data/additionalControls";

const all = [...assessmentQuestions, ...additionalControls];
const seen = new Set<number>();
const dups = all.filter(q => {
  if (seen.has(q.id)) {
    return true;
  }
  seen.add(q.id);
  return false;
});

if (dups.length === 0) {
  console.log("No duplicate IDs found.");
} else {
  console.log("Duplicate IDs:", dups.map(q => q.id));
  dups.forEach(q => {
    console.log(`ID: ${q.id}, Category: ${q.category}, Section: ${q.section}, Ref: ${q.standardRef}`);
  });
}
