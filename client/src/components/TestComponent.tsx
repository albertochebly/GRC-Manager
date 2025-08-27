import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RichTextEditor from "@/components/shared/rich-text-editor";

interface Props {
  organizationId: string;
  initialTemplate?: string;
  onSave?: (template: string) => void;
}

function MaturityAssessmentReportEditorImpl({ organizationId, initialTemplate, onSave }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [template, setTemplate] = useState(initialTemplate || "");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (organizationId) {
      const saved = localStorage.getItem(`gapAssessmentTemplate_${organizationId}`);
      if (saved) setTemplate(saved);
    }
  }, [organizationId]);

  const handleSave = () => {
    let htmlTemplate = template;
    if (editorRef.current && editorRef.current.innerHTML) {
      htmlTemplate = editorRef.current.innerHTML;
    }
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
