import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RichTextEditor from "@/components/shared/rich-text-editor";
import html2canvas from "html2canvas";

// Helper: get color for maturity level
const getColor = (level, maturityLevels) => {
  const found = maturityLevels.find(l => l.value === level);
  if (!found) return [255,255,255];
  switch (found.color) {
    case "bg-red-100 text-red-800": return [255, 204, 203];
    case "bg-orange-100 text-orange-800": return [255, 229, 180];
    case "bg-yellow-100 text-yellow-800": return [255, 255, 199];
    case "bg-blue-100 text-blue-800": return [199, 224, 255];
    case "bg-green-100 text-green-800": return [199, 255, 220];
    case "bg-purple-100 text-purple-800": return [229, 199, 255];
    case "bg-gray-100 text-gray-800": return [240, 240, 240];
    default: return [255,255,255];
  }
}
export async function generateMaturityAssessmentPDF({
  maturityLevels,
  gapTableData,
  gapAssessmentTemplate,
}) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const TOP_MARGIN = 40;
  const BOTTOM_MARGIN = 40;
  const PAGE_WIDTH = pdf.internal.pageSize.getWidth();
  const SIDE_MARGIN = 20;
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * SIDE_MARGIN;
  const X_CENTER = SIDE_MARGIN;
  let y = TOP_MARGIN;
  // Split template at placeholder
  let beforeHTML = "";
  let afterHTML = "";
  const placeholder = "{{GAP_ASSESSMENT_TABLE}}";
  const firstIndex = gapAssessmentTemplate.indexOf(placeholder);
  if (firstIndex !== -1) {
    beforeHTML = gapAssessmentTemplate.substring(0, firstIndex);
    afterHTML = gapAssessmentTemplate.substring(firstIndex + placeholder.length);
  } else {
    beforeHTML = gapAssessmentTemplate;
    afterHTML = "";
  }

  // Helper to render HTML to PDF and measure height using a hidden DOM element
  const measureHtmlHeight = (htmlText) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.width = '500px';
    tempDiv.innerHTML = htmlText;
    document.body.appendChild(tempDiv);
    const height = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);
    return height;
  };

  const PAGE_HEIGHT = pdf.internal.pageSize.getHeight();

  const renderHtmlToPdf = async (sectionText, y, marginType = "bottom") => {
    if (!sectionText || !sectionText.trim()) return y;
    let sanitized = sectionText.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\s+/, '').replace(/\s+$/, '');
  // Wide fixed content, justified text, full width
  const htmlText = `
    <html style='height:100%; margin:0; padding:0;'>
      <body style='display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; padding:0; height:100%;'>
  <div style='width:800px; font-family: Times New Roman, Times, serif;'>
          <style>
            img { max-width:100%; height:auto; display:block; margin:auto; margin-bottom:24px; }
            h1 { text-align: center; font-size: 22pt; font-weight: bold; margin-top: 32px; margin-bottom: 18px; }
            h2, h3 { text-align: left; font-weight: bold; margin-top: 24px; margin-bottom: 12px; font-size: 14pt; }
            p, ul, ol, li { text-align: justify; margin-bottom: 8px; line-height: 1.5; font-size: 11pt; width: 100%; }
            .section { margin-bottom: 24px; }
          </style>
          ${sanitized.replace(/\n/g, '<br>')}
        </div>
      </body>
    </html>`;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    await pdf.html(tempDiv, {
      x: X_CENTER,
      y,
      html2canvas: { scale: 0.6 },
      autoPaging: true,
  margin: [TOP_MARGIN, SIDE_MARGIN, BOTTOM_MARGIN, SIDE_MARGIN], // top, right, bottom, left
    });
    // Use measured height to update Y position
    const measuredHeight = measureHtmlHeight(htmlText);
    let nextY = y + measuredHeight + 10;
    // If nextY is near the bottom, add a new page
    if (nextY > PAGE_HEIGHT - BOTTOM_MARGIN) {
      pdf.addPage();
      nextY = TOP_MARGIN;
    }
    return nextY;
  };

  // Only show gapped rows (current ≠ target)
  const gappedRows = gapTableData.filter(row => row[4] !== row[5]);

  // If template contains placeholder, render before, table, then after
  if (gapAssessmentTemplate.includes("{{GAP_ASSESSMENT_TABLE}}")) {
    // Render beforeHTML
    if (beforeHTML && beforeHTML.trim()) {
      y = await renderHtmlToPdf(beforeHTML, y, "bottom");
    }
    // Render table at placeholder (only gapped rows)
    if (gappedRows && gappedRows.length) {
      // Always render the table directly after the last text, regardless of remaining space
      autoTable(pdf, {
        startY: y, // no extra spacing after last text
        head: [[
          "Category", "Section", "Standard Ref", "Assessment Question",
          "Current Maturity Level", "Target Maturity Level", "Current Comments"
        ]],
        body: gappedRows,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 0, bottom: BOTTOM_MARGIN, left: SIDE_MARGIN, right: SIDE_MARGIN },
      });
      y = ((pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY : y) + 24;
    }
    // Render afterHTML starting exactly after the table
    if (afterHTML && afterHTML.trim()) {
      y = await renderHtmlToPdf(afterHTML, y, "bottom");
    }
  } else {
    // No placeholder: render the template first (if any), then always render the table
    if (gapAssessmentTemplate && gapAssessmentTemplate.trim()) {
      y = await renderHtmlToPdf(gapAssessmentTemplate, y, "bottom");
    }
    
    // Always render the table (even if no template)
    if (gappedRows && gappedRows.length) {
      autoTable(pdf, {
        startY: y,
        head: [[
          "Category", "Section", "Standard Ref", "Assessment Question",
          "Current Maturity Level", "Target Maturity Level", "Current Comments"
        ]],
        body: gappedRows,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 0, bottom: BOTTOM_MARGIN, left: SIDE_MARGIN, right: SIDE_MARGIN },
      });
      y = ((pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY : y) + 24;
    } else {
      // If no gapped rows, render all assessment data
      if (gapTableData && gapTableData.length) {
        autoTable(pdf, {
          startY: y,
          head: [[
            "Category", "Section", "Standard Ref", "Assessment Question",
            "Current Maturity Level", "Target Maturity Level", "Current Comments"
          ]],
          body: gapTableData,
          theme: "grid",
          styles: { fontSize: 10, cellPadding: 2 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          margin: { top: 0, bottom: BOTTOM_MARGIN, left: SIDE_MARGIN, right: SIDE_MARGIN },
        });
        y = ((pdf as any).lastAutoTable ? (pdf as any).lastAutoTable.finalY : y) + 24;
      }
    }
  }
  pdf.save("Maturity-Assessment-Report.pdf");
}

function MaturityAssessmentReportEditorImpl({ organizationId, initialTemplate, onSave }: {
  organizationId: string;
  initialTemplate?: string;
  onSave?: (template: string) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [template, setTemplate] = useState(initialTemplate || "");

  // Load template from localStorage on mount
  React.useEffect(() => {
    if (organizationId) {
      const saved = localStorage.getItem(`gapAssessmentTemplate_${organizationId}`);
      if (saved) setTemplate(saved);
    }
  }, [organizationId]);

  const editorRef = React.useRef(null);
  const handleSave = () => {
    // Always get the HTML string from the editor DOM
    let htmlTemplate = template;
    if (editorRef.current && editorRef.current.innerHTML) {
      htmlTemplate = editorRef.current.innerHTML;
    }
    // Save to localStorage per organization
    if (organizationId) {
      localStorage.setItem(`gapAssessmentTemplate_${organizationId}`, htmlTemplate);
    }
    if (onSave) onSave(htmlTemplate);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Report Template</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Gap Assessment Report Template</DialogTitle>
        </DialogHeader>
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="mb-2 text-xs text-gray-500">
            Use <code>{"{{GAP_ASSESSMENT_TABLE}}"}</code> in your template to insert the assessment table at that position.
          </div>
          <RichTextEditor
            value={template}
            onChange={setTemplate}
            placeholder="Enter template text for the gap assessment section..."
            ref={editorRef}
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave}>Save Template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const MaturityAssessmentReportEditor = React.memo(MaturityAssessmentReportEditorImpl);
