import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/shared/rich-text-editor";

const documentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  documentType: z.string().min(1, "Document type is required"),
  version: z.string().min(1, "Version is required"),
  content: z.string().min(1, "Document content is required"),
});

type DocumentForm = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  onSubmit: (data: DocumentForm) => void;
  isLoading?: boolean;
  initialData?: Partial<DocumentForm>;
}

export default function DocumentForm({ onSubmit, isLoading, initialData }: DocumentFormProps) {
  const [content, setContent] = useState(initialData?.content || "");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: initialData?.title || "",
      documentType: initialData?.documentType || "",
      version: initialData?.version || "1.0",
      content: initialData?.content || "",
    },
  });

  const handleFormSubmit = (data: DocumentForm) => {
    onSubmit({ ...data, content });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setValue("content", newContent, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" data-testid="document-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Password Policy"
            data-testid="input-document-title"
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="documentType">Document Type</Label>
          <Select onValueChange={(value) => setValue("documentType", value)}>
            <SelectTrigger data-testid="select-document-type">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="policy">Policy</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="procedure">Procedure</SelectItem>
              <SelectItem value="guideline">Guideline</SelectItem>
              <SelectItem value="plan">Plan</SelectItem>
            </SelectContent>
          </Select>
          {errors.documentType && (
            <p className="text-sm text-red-600 mt-1">{errors.documentType.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="version">Version</Label>
        <Input
          id="version"
          {...register("version")}
          placeholder="1.0"
          data-testid="input-document-version"
        />
        {errors.version && (
          <p className="text-sm text-red-600 mt-1">{errors.version.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="content">Document Content</Label>
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Enter the document content..."
        />
        {errors.content && (
          <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-submit-document"
        >
          {isLoading ? "Creating..." : "Create Document"}
        </Button>
      </div>
    </form>
  );
}
