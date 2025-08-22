import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useLocation, useNavigate } from "react-router-dom";
import type { Organization, Document } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import DocumentForm from "@/components/documents/document-form";
import { Button } from "@/components/ui/button";
import { useOrganizationStore } from "@/stores/organizationStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Edit, Eye, Filter, Trash2, MoreHorizontal, CheckCircle, Clock, Archive } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Documents() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganization, selectedOrganizationId, setSelectedOrganizationId, organizations } = useOrganizations();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");

  // Get user role in selected organization
  const userRole = selectedOrganization?.role || "read-only";
  
  // Permission checks
  const canCreateDocuments = userRole !== "read-only";
  const canEditDocuments = userRole !== "read-only";
  const canChangeStatus = userRole === "approver" || userRole === "admin";
  const canDeleteDocuments = userRole === "admin";

  // Get documents for selected organization
  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "documents"],
    queryFn: async (): Promise<Document[]> => {
      if (!selectedOrganizationId) {
        return [];
      }
      const response = await apiRequest(
        "GET",
        `/api/organizations/${selectedOrganizationId}/documents`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch documents');
      }
      const data = await response.json();
      console.log('Fetched documents:', data);
      return data;
    },
    enabled: !!selectedOrganizationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 1000, // Refetch every second while the component is mounted
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      console.log('Selected organization ID:', selectedOrganizationId);
      console.log('Form data:', formData);

      const documentData = {
        title: formData.title,
        content: formData.content,
        documentType: formData.documentType,
        version: formData.version,
        status: "draft"
      };

      console.log('Creating document with data:', documentData);
      
      const response = await apiRequest(
        "POST", 
        `/api/organizations/${selectedOrganizationId}/documents`, 
        documentData
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Document creation failed:', error);
        throw new Error(error.message || 'Failed to create document');
      }

      const result = await response.json();
      console.log('Document creation response:', result);
      return result;
    },
    onSuccess: async (newDoc) => {
      console.log('Document created successfully:', newDoc);
      try {
        // Clear the cache
        await queryClient.invalidateQueries({
          queryKey: ["/api/organizations", selectedOrganizationId, "documents"]
        });
        
        // Fetch fresh data
        const freshData = await queryClient.fetchQuery<Document[]>({
          queryKey: ["/api/organizations", selectedOrganizationId, "documents"],
          queryFn: async (): Promise<Document[]> => {
            const response = await apiRequest(
              "GET",
              `/api/organizations/${selectedOrganizationId}/documents`
            );
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to fetch documents');
            }
            return response.json();
          }
        });
        
        console.log('Fetched fresh documents:', freshData);
      } catch (error) {
        console.error('Error refreshing documents:', error);
      }
      
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Document created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      });
    },
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Handle edit query parameter from dashboard navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const editDocumentId = urlParams.get('edit');
    
    if (editDocumentId && documents.length > 0) {
      const documentToEdit = documents.find(doc => doc.id === editDocumentId);
      if (documentToEdit) {
        setSelectedDocument(documentToEdit);
        setEditDialogOpen(true);
        // Remove the query parameter from URL to clean it up
        navigate('/documents', { replace: true });
      }
    }
  }, [location.search, documents, navigate]);

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      console.log('Deleting document:', { id, organizationId: selectedOrganizationId });
      
      const response = await apiRequest(
        "DELETE",
        `/api/organizations/${selectedOrganizationId}/documents/${id}`
      );

      console.log('Delete response:', { status: response.status });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete document");
        } catch {
          throw new Error("Failed to delete document");
        }
      }
      
      return id;
    },
    onSuccess: (deletedId) => {
      console.log('Document deleted, updating UI:', deletedId);
      
      // Immediately update the cache
      queryClient.setQueryData<Document[]>(
        ["/api/organizations", selectedOrganizationId, "documents"],
        (oldData) => oldData?.filter(doc => doc.id !== deletedId) ?? []
      );
      
      // Force a refetch to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", selectedOrganizationId, "documents"]
      });
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...updateData } = data;
      const response = await apiRequest(
        "PUT",
        `/api/organizations/${selectedOrganizationId}/documents/${id}`,
        updateData
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update document");
      }
      return response.json();
    },
    onSuccess: (updatedDoc) => {
      // Immediately update the cache with the new document
      queryClient.setQueryData<Document[]>(
        ["/api/organizations", selectedOrganizationId, "documents"],
        (oldData) => {
          if (!oldData) return [updatedDoc];
          return oldData.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc);
        }
      );

      // Force a refetch to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", selectedOrganizationId, "documents"]
      });

      setEditDialogOpen(false);
      setSelectedDocument(null);
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update document",
        variant: "destructive",
      });
    },
  });

  // Status change mutation for approvers and admins
  const changeStatusMutation = useMutation({
    mutationFn: async ({ documentId, status }: { documentId: string; status: string }) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      console.log('Changing document status:', { documentId, status, organizationId: selectedOrganizationId });
      
      const response = await apiRequest(
        "PATCH",
        `/api/organizations/${selectedOrganizationId}/documents/${documentId}/status`,
        { status }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Status change failed:', error);
        throw new Error(error.error || 'Failed to change document status');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Status changed successfully:', data);
      
      // Force a refetch to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", selectedOrganizationId, "documents"]
      });

      toast({
        title: "Success",
        description: data.message || "Document status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change document status",
        variant: "destructive",
      });
    },
  });

  // Filter documents by type
  const filteredDocuments = useMemo(() => {
    console.log('Filtering documents:', { documents, documentTypeFilter });
    if (!Array.isArray(documents)) {
      console.warn('Documents is not an array:', documents);
      return [];
    }
    const filtered = documents.filter((doc: Document) => {
      if (!doc) {
        console.warn('Found null document in list');
        return false;
      }
      if (documentTypeFilter === "all") return true;
      return doc.documentType === documentTypeFilter;
    });
    console.log('Filtered documents:', filtered);
    return filtered;
  }, [documents, documentTypeFilter]);

  // CSV import handler

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      pending: "default",
      published: "default",
      archived: "destructive",
    };
    
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50" data-testid="documents-page">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              {/* Title and description now handled by Header component */}
            </div>

            {/* Document type filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-document-type">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="guideline">Guideline</SelectItem>
                    <SelectItem value="plan">Plan</SelectItem>
                    <SelectItem value="charter">Charter</SelectItem>
                    <SelectItem value="framework">Framework</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedOrganizationId && canCreateDocuments && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-document">
                    <Plus className="w-4 h-4 mr-2" />
                    New Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Document</DialogTitle>
                  </DialogHeader>
                  <DocumentForm
                    onSubmit={(data) => createDocumentMutation.mutate({ ...data, organizationId: selectedOrganizationId })}
                    isLoading={createDocumentMutation.isPending}
                    initialData={{}}
                    userRole={userRole}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!selectedOrganizationId ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
                <p className="text-gray-600">Choose an organization to view and manage its documents.</p>
              </CardContent>
            </Card>
          ) : docsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first GRC document.</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-first-document">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Document
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Document Library</CardTitle>
                <CardDescription>All GRC documents for the selected organization</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc: any) => (
                      <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>{doc.documentType || "Document"}</TableCell>
                        <TableCell>{doc.version}</TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>{format(new Date(doc.updatedAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Delete Button - Admins and Approvers only */}
                            {(userRole === "admin" || userRole === "approver") && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="bg-red-50 hover:bg-red-100 text-red-600"
                                    data-testid={`button-delete-${doc.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{doc.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {/* View Button - Available to all roles */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" data-testid={`button-view-${doc.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>{doc.title}</DialogTitle>
                                  <DialogDescription>
                                    Version {doc.version} • {doc.documentType} • Last updated {format(new Date(doc.updatedAt), 'MMM dd, yyyy')}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 prose max-w-none">
                                  <div dangerouslySetInnerHTML={{ __html: doc.content }} />
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            {/* Status Change Dropdown for Approvers/Admins */}
                            {canChangeStatus && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" data-testid={`button-status-${doc.id}`}>
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {doc.status === "draft" && (
                                    <DropdownMenuItem
                                      onClick={() => changeStatusMutation.mutate({ documentId: doc.id, status: "pending" })}
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      Submit for Review
                                    </DropdownMenuItem>
                                  )}
                                  {doc.status === "pending" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => changeStatusMutation.mutate({ documentId: doc.id, status: "published" })}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve & Publish
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => changeStatusMutation.mutate({ documentId: doc.id, status: "draft" })}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Return to Draft
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {doc.status === "published" && (
                                    <DropdownMenuItem
                                      onClick={() => changeStatusMutation.mutate({ documentId: doc.id, status: "archived" })}
                                    >
                                      <Archive className="w-4 h-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                  {doc.status === "archived" && (
                                    <DropdownMenuItem
                                      onClick={() => changeStatusMutation.mutate({ documentId: doc.id, status: "published" })}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Restore to Published
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}

                            {/* Edit Button - Contributors can only edit drafts */}
                            {(canEditDocuments && (userRole === "admin" || userRole === "approver" || doc.status === "draft")) && (
                              <Dialog open={editDialogOpen && selectedDocument?.id === doc.id} onOpenChange={(open) => {
                                if (!open) {
                                  setEditDialogOpen(false);
                                  setSelectedDocument(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    data-testid={`button-edit-${doc.id}`}
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit Document</DialogTitle>
                                  </DialogHeader>
                                  <DocumentForm
                                    onSubmit={(data) => {
                                      updateDocumentMutation.mutate({
                                        id: doc.id,
                                        ...data,
                                        organizationId: selectedOrganizationId
                                      });
                                    }}
                                    isLoading={updateDocumentMutation.isPending}
                                    initialData={{
                                      title: doc.title,
                                      documentType: doc.documentType,
                                      version: doc.version,
                                      content: doc.content,
                                      framework: doc.framework,
                                      status: doc.status
                                    }}
                                    userRole={userRole}
                                  />
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* CSV Import Dialog */}
        </main>
      </div>
    </div>
  );
}
