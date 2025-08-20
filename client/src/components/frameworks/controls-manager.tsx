import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Framework, Control } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

interface ControlsManagerProps {
  frameworkId: string;
  frameworkName: string;
}

interface ControlFormData {
  controlId: string;
  title: string;
  description: string;
  category: string;
}

export default function ControlsManager({ frameworkId, frameworkName }: ControlsManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<Control | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ControlFormData>({
    controlId: "",
    title: "",
    description: "",
    category: "",
  });

  // Get controls for this framework
  const { data: controls = [], isLoading } = useQuery<Control[]>({
    queryKey: ["/api/frameworks", frameworkId, "controls"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/frameworks/${frameworkId}/controls`);
      if (!response.ok) {
        throw new Error("Failed to fetch controls");
      }
      return response.json();
    },
  });

  // Add control mutation
  const addControlMutation = useMutation({
    mutationFn: async (data: ControlFormData) => {
      const response = await apiRequest("POST", `/api/frameworks/${frameworkId}/controls`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add control");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks", frameworkId, "controls"] });
      setIsAddDialogOpen(false);
      setFormData({ controlId: "", title: "", description: "", category: "" });
      toast({
        title: "Success",
        description: "Control added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update control mutation
  const updateControlMutation = useMutation({
    mutationFn: async ({ controlId, data }: { controlId: string; data: ControlFormData }) => {
      const response = await apiRequest("PUT", `/api/frameworks/${frameworkId}/controls/${controlId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update control");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks", frameworkId, "controls"] });
      setIsEditDialogOpen(false);
      setEditingControl(null);
      setFormData({ controlId: "", title: "", description: "", category: "" });
      toast({
        title: "Success",
        description: "Control updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete control mutation
  const deleteControlMutation = useMutation({
    mutationFn: async (controlId: string) => {
      const response = await apiRequest("DELETE", `/api/frameworks/${frameworkId}/controls/${controlId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete control");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frameworks", frameworkId, "controls"] });
      toast({
        title: "Success",
        description: "Control deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddControl = () => {
    setFormData({ controlId: "", title: "", description: "", category: "" });
    setIsAddDialogOpen(true);
  };

  const handleEditControl = (control: Control) => {
    setEditingControl(control);
    setFormData({
      controlId: control.controlId,
      title: control.title,
      description: control.description || "",
      category: control.category || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteControl = (control: Control) => {
    if (confirm(`Are you sure you want to delete control "${control.controlId}: ${control.title}"? This will also delete all associated templates and cannot be undone.`)) {
      deleteControlMutation.mutate(control.id);
    }
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.controlId.trim() || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Control ID and title are required",
        variant: "destructive",
      });
      return;
    }
    addControlMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingControl || !formData.controlId.trim() || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Control ID and title are required",
        variant: "destructive",
      });
      return;
    }
    updateControlMutation.mutate({ controlId: editingControl.id, data: formData });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Framework Controls</h3>
          <p className="text-sm text-gray-600">Manage controls (sections) for {frameworkName}</p>
        </div>
        <Button onClick={handleAddControl} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Control
        </Button>
      </div>

      {controls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">No controls found for this framework.</p>
            <Button onClick={handleAddControl} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Control
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Templates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {controls.map((control: any) => (
                  <TableRow key={control.id}>
                    <TableCell className="font-mono text-sm">{control.controlId}</TableCell>
                    <TableCell className="font-medium max-w-md">
                      <div>
                        <div className="font-medium">{control.title}</div>
                        {control.description && (
                          <div className="text-sm text-gray-600 mt-1 truncate">
                            {control.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {control.category && (
                        <Badge variant="outline">{control.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {control.templates?.length || 0} template(s)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditControl(control)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteControl(control)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Control Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Control</DialogTitle>
            <DialogDescription>
              Add a new control section to {frameworkName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="controlId">Control ID *</Label>
                <Input
                  id="controlId"
                  placeholder="e.g., A.12.1.1"
                  value={formData.controlId}
                  onChange={(e) => setFormData({ ...formData, controlId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Operational Security"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Documented operating procedures"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the control..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addControlMutation.isPending}>
                {addControlMutation.isPending ? "Adding..." : "Add Control"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Control Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Control</DialogTitle>
            <DialogDescription>
              Modify the control details for {frameworkName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editControlId">Control ID *</Label>
                <Input
                  id="editControlId"
                  placeholder="e.g., A.12.1.1"
                  value={formData.controlId}
                  onChange={(e) => setFormData({ ...formData, controlId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategory">Category</Label>
                <Input
                  id="editCategory"
                  placeholder="e.g., Operational Security"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title *</Label>
              <Input
                id="editTitle"
                placeholder="e.g., Documented operating procedures"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Detailed description of the control..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateControlMutation.isPending}>
                {updateControlMutation.isPending ? "Updating..." : "Update Control"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
