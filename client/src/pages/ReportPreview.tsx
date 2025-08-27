import React from "react";
// Import your assessment data and template logic as needed
// Example props: organizationName, assessmentData, gapAssessmentTemplate

const sampleTable = (
  <table style={{ width: "100%", borderCollapse: "collapse", margin: "24px 0" }} border={1}>
    <thead>
      <tr>
        <th>Category</th>
        <th>Section</th>
        <th>Standard Ref</th>
        <th>Assessment Question</th>
        <th>Current Maturity Level</th>
        <th>Target Maturity Level</th>
        <th>Current Comments</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Annex A Controls</td>
        <td>A.5 - Organizational controls</td>
        <td>Control-5.1</td>
        <td>Are the information security policy and topic-specific policies defined, approved by management, published, communicated to and acknowledged by relevant personnel and interested parties, and reviewed at planned intervals or when significant changes occur?</td>
        <td>0 – Not Defined</td>
        <td>5- Yes, Optimizing & continually improved</td>
        <td>this is a test command for testing the spacing between the table and end of page</td>
      </tr>
      <tr>
        <td>Mandatory Clauses</td>
        <td>4 - Context of the organization</td>
        <td>Clause-4.1</td>
        <td>Has the organization identified relevant internal and external issues that has the potential to affect its ISMS achieving its intended outcomes?</td>
        <td>4 - Yes, measured & managed</td>
        <td>5- Yes, Optimizing & continually improved</td>
        <td></td>
      </tr>
    </tbody>
  </table>
);

export default function ReportPreview() {
  // DEBUG: Show all gapAssessmentTemplate_* keys and values
  const allTemplateKeys = Object.keys(localStorage).filter(k => k.startsWith('gapAssessmentTemplate_'));
  const allTemplates = allTemplateKeys.map(k => ({ key: k, value: localStorage.getItem(k) }));
  // DEBUG: Show selectedOrganizationId and key being checked
  const orgId = localStorage.getItem('selectedOrganizationId') || '';
  const templateKey = `gapAssessmentTemplate_${orgId}`;
  const rawTemplateBeforePatch = localStorage.getItem(templateKey);
  // Fallback default template
  const defaultTemplate = `
    <h2>Suggested Bridging Options</h2>
    <p>Recommend actionable strategies to bridge the identified gaps, including process improvements, tool enhancements, training programs, and resource allocation.</p>
    {{GAP_ASSESSMENT_TABLE}}
    <h2>Summary and Next Steps</h2>
    <p>Summarize the key findings from the gap analysis. Outline the next steps to be taken, including timelines for implementation, responsible parties, and any follow-up assessments required to measure progress.</p>
  `;

  // Try to load template from localStorage
  // Extract raw HTML if template is wrapped in extra markup (e.g., OutlineElement)
  let template = rawTemplateBeforePatch;
  let rawTemplateAfterPatch = rawTemplateBeforePatch;
  let templateType = typeof template;
  let extractionNote = '';
  let templateError = '';
  if (template) {
    if (typeof template === 'string') {
      if (template.startsWith('<div')) {
        // Try to extract innerHTML from the first div
        const match = template.match(/<div[^>]*>([\s\S]*)<\/div>/);
        if (match && match[1]) {
          template = match[1];
          rawTemplateAfterPatch = template;
          extractionNote = 'Extracted innerHTML from first <div>.';
        } else {
          extractionNote = 'No innerHTML extracted from <div>.';
        }
      } else {
        extractionNote = 'Template does not start with <div>.';
      }
    } else {
      templateError = 'ERROR: Template in localStorage is not a string. Please ensure the template editor saves the template as HTML (string), not as a React element or object.';
      extractionNote = 'Template is not a string.';
      template = '';
    }
  } else {
    extractionNote = 'No template found.';
  }
  // If template exists but is missing the placeholder, patch it in localStorage
  if (template && !template.includes('{{GAP_ASSESSMENT_TABLE}}')) {
    // Insert placeholder before closing </div> or at the end if not found
    let patched = template;
    if (patched.includes('</div>')) {
      patched = patched.replace('</div>', '{{GAP_ASSESSMENT_TABLE}}</div>');
    } else {
      patched = patched + '\n{{GAP_ASSESSMENT_TABLE}}';
    }
    localStorage.setItem(templateKey, patched);
    template = patched;
    rawTemplateAfterPatch = patched;
  }
  let debugTemplate = template;
  let missingPlaceholder = false;
  if (!template) {
    template = defaultTemplate;
    debugTemplate = defaultTemplate;
    missingPlaceholder = true;
  } else if (!template.includes('{{GAP_ASSESSMENT_TABLE}}')) {
    // Show warning if template is missing placeholder
    missingPlaceholder = true;
    template = template + '\n<!-- WARNING: Missing {{GAP_ASSESSMENT_TABLE}} placeholder. Table will be appended at the end. -->';
    debugTemplate = template;
  }

  // Sample table data (replace with real assessment data)
  const table = sampleTable;

  // Split template at placeholder
  let before = '', after = '';
  if (template.includes('{{GAP_ASSESSMENT_TABLE}}')) {
    [before, after] = template.split('{{GAP_ASSESSMENT_TABLE}}');
  } else {
    before = template;
    after = '';
  }
  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif", background: "#fff", color: "#222" }}>
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>Maturity Assessment Report</h1>
      <pre style={{ background: '#f8f8f8', color: '#333', padding: '8px', fontSize: '12px', marginBottom: '16px', maxHeight: '400px', overflow: 'auto' }}>
        <strong>DEBUG: selectedOrganizationId</strong> {orgId}
        <br />
        <strong>DEBUG: templateKey</strong> {templateKey}
        <br />
        <strong>DEBUG: typeof rawTemplateBeforePatch</strong> {templateType}
        <br />
        <strong>DEBUG: rawTemplateBeforePatch (first 500 chars)</strong>\n{rawTemplateBeforePatch && rawTemplateBeforePatch.substring(0,500)}
        <br />
        <strong>DEBUG: extractionNote</strong> {extractionNote}
        <br />
        {templateError && (
          <span style={{ color: 'red', fontWeight: 'bold' }}>{templateError}</span>
        )}
        <br />
        <strong>DEBUG: rawTemplateAfterPatch (first 500 chars)</strong>\n{rawTemplateAfterPatch && rawTemplateAfterPatch.substring(0,500)}
        <br />
        <strong>DEBUG: All gapAssessmentTemplate_* keys and values</strong>
        {allTemplates.map(t => `\n${t.key}:\n${t.value && t.value.substring(0,500)}\n`).join('')}
        <br />
        <strong>DEBUG: Template used (first 500 chars)</strong>
        {debugTemplate && debugTemplate.substring(0,500)}
        <br />
        {missingPlaceholder && (
          <span style={{ color: 'red', fontWeight: 'bold' }}>
            WARNING: Template is missing the {'{{GAP_ASSESSMENT_TABLE}}'} placeholder. Table will be appended at the end.
          </span>
        )}
      </pre>
      {/* Render template before the table */}
      <div dangerouslySetInnerHTML={{ __html: before || '' }} />
      {/* Render the table at the placeholder or at the end if missing */}
      {table}
      {/* Render template after the table */}
      <div dangerouslySetInnerHTML={{ __html: after || '' }} />
    </div>
  );
}
