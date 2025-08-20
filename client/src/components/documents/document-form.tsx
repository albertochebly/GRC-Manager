import React, { useState, useEffect } from "react";
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
  status: z.string().default("draft"),
  framework: z.string().optional(),
});

type DocumentForm = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  onSubmit: (data: DocumentForm) => void;
  isLoading?: boolean;
  initialData?: Partial<DocumentForm> & { id?: string };
  userRole?: string;
}

export default function DocumentForm({ onSubmit, isLoading, initialData, userRole }: DocumentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: initialData?.title || "",
      documentType: initialData?.documentType || "",
      version: initialData?.version || "1.0",
      content: initialData?.content || "",
      framework: initialData?.framework || "",
    },
  });

  const content = watch("content");

  // Initialize form values when initialData changes
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof DocumentForm, value);
        }
      });
    }
  }, [initialData, setValue]);

  const handleFormSubmit = (data: DocumentForm) => {
    onSubmit(data);
  };

  const handleContentChange = (newContent: string) => {
    setValue("content", newContent, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" data-testid="document-form">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <Select 
            value={watch("documentType")} 
            onValueChange={(value) => setValue("documentType", value)}
          >
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

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch("status") || "draft"}
            onValueChange={(value: "draft" | "pending" | "published" | "archived") => 
              setValue("status", value)
            }
          >
            <SelectTrigger data-testid="select-document-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              {/* Contributors can submit for review */}
              {(userRole === "contributor" || userRole === "approver" || userRole === "admin") && (
                <SelectItem value="pending">Pending Review</SelectItem>
              )}
              {/* Only approvers and admins can publish or archive */}
              {(userRole === "approver" || userRole === "admin") && (
                <>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
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
        <div className="min-h-[300px]">
          <RichTextEditor
            key={initialData?.id} // Force re-render when document changes
            value={content || ''}
            onChange={handleContentChange}
            placeholder="Enter the document content..."
          />
        </div>
        {errors.content && (
          <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-submit-document"
        >
          {isLoading ? "Saving..." : initialData?.id ? "Save Changes" : "Create Document"}
        </Button>
      </div>
    </form>
  );
}
