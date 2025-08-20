import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileText } from "lucide-react";
import RichTextEditor from "@/components/shared/rich-text-editor";

interface ControlTemplate {
  id: string;
  documentTitle: string;
  documentType: string;
  documentDescription?: string;
  contentTemplate?: string;
}

interface Control {
  id: string;
  controlId: string;
  title: string;
  description?: string;
  category?: string;
  templates: ControlTemplate[];
}

interface ControlTemplatesManagerProps {
  frameworkId: string;
  frameworkName: string;
}

export default function ControlTemplatesManager({ frameworkId, frameworkName }: ControlTemplatesManagerProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    documentTitle: "",
    documentType: "",
    documentDescription: "",
    contentTemplate: "",
  });

  // Get controls for this framework
  const { data: controls = [], isLoading } = useQuery<Control[]>({
    queryKey: ["/api/frameworks", frameworkId, "controls"],
    enabled: isAuthenticated && !!frameworkId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/frameworks/${frameworkId}/controls`);
      if (!response.ok) {
        throw new Error("Failed to fetch controls");
      }
      return response.json();
    }
  });

  // Add template mutation
  const addTemplateMutation = useMutation({
    mutationFn: async ({ controlId, template }: { controlId: string; template: typeof newTemplate }) => {
      const response = await apiRequest(
        "POST",
        `/api/frameworks/${frameworkId}/controls/${controlId}/templates`,
        template
      );
      if (!response.ok) {
        throw new Error("Failed to add template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks", frameworkId, "controls"] });
      setIsAddTemplateDialogOpen(false);
      setNewTemplate({
        documentTitle: "",
        documentType: "",
        documentDescription: "",
        contentTemplate: "",
      });
      toast({
        title: "Success",
        description: "Template added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add template",
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async ({ controlId, templateId }: { controlId: string; templateId: string }) => {
      const response = await apiRequest(
        "DELETE",
        `/api/frameworks/${frameworkId}/controls/${controlId}/templates/${templateId}`
      );
      if (!response.ok) {
        throw new Error("Failed to delete template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks", frameworkId, "controls"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  });

  const handleAddTemplate = () => {
    if (!selectedControl) return;
    addTemplateMutation.mutate({
      controlId: selectedControl.id,
      template: newTemplate
    });
  };

  const handleDeleteTemplate = (controlId: string, templateId: string) => {
    deleteTemplateMutation.mutate({ controlId, templateId });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading controls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Control Templates</h2>
          <p className="text-gray-600">
            Manage document templates for {frameworkName} controls. These templates will be used to automatically create document drafts when the framework is activated.
          </p>
        </div>
      </div>

      <div className="grid gap-6 w-full">
        {controls.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Controls Found</h3>
              <p className="text-gray-600">This framework doesn't have any controls defined yet.</p>
            </CardContent>
          </Card>
        ) : (
          controls.map((control) => (
            <Card key={control.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{control.controlId}: {control.title}</CardTitle>
                    {control.category && (
                      <Badge variant="outline" className="mt-1">{control.category}</Badge>
                    )}
                  </div>
                  <Dialog 
                    open={isAddTemplateDialogOpen && selectedControl?.id === control.id}
                    onOpenChange={(open) => {
                      setIsAddTemplateDialogOpen(open);
                      if (open) {
                        setSelectedControl(control);
                      } else {
                        setSelectedControl(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setSelectedControl(control)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Document Template</DialogTitle>
                        <DialogDescription>
                          Create a template for documents that will be automatically generated for this control.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="documentTitle">Document Title</Label>
                          <Input
                            id="documentTitle"
                            value={newTemplate.documentTitle}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, documentTitle: e.target.value }))}
                            placeholder="e.g., Password Policy"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="documentType">Document Type</Label>
                          <Select
                            value={newTemplate.documentType}
                            onValueChange={(value) => setNewTemplate(prev => ({ ...prev, documentType: value }))}
                          >
                            <SelectTrigger>
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
                        </div>

                        <div>
                          <Label htmlFor="documentDescription">Description (Optional)</Label>
                          <Textarea
                            id="documentDescription"
                            value={newTemplate.documentDescription}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, documentDescription: e.target.value }))}
                            placeholder="Brief description of what this document should contain"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label htmlFor="contentTemplate">Content Template (Optional)</Label>
                          <div className="mt-2">
                            <RichTextEditor
                              value={newTemplate.contentTemplate}
                              onChange={(value) => setNewTemplate(prev => ({ ...prev, contentTemplate: value }))}
                              placeholder="Template content that will be used as the initial content for the document. You can include formatting, images, tables, etc."
                              className="min-h-[300px]"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsAddTemplateDialogOpen(false);
                              setSelectedControl(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddTemplate}
                            disabled={!newTemplate.documentTitle || !newTemplate.documentType || addTemplateMutation.isPending}
                          >
                            {addTemplateMutation.isPending ? "Adding..." : "Add Template"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {control.description && (
                  <CardDescription>{control.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                {control.templates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No document templates defined for this control.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {control.templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.documentTitle}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{template.documentType}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {template.documentDescription || "No description"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTemplate(control.id, template.id)}
                              disabled={deleteTemplateMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
