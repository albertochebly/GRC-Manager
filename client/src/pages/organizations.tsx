import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Building, Users, Calendar, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

export default function Organizations() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { organizations, isLoading: orgsLoading, refetch: refetchOrgs } = useOrganizations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrgForm) => {
      const response = await apiRequest("POST", "/api/organizations", data);
      return response.json();
    },
    onSuccess: async () => {
      await refetchOrgs();
      setIsDialogOpen(false);
      reset();
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        window.location.href = "/api/login";
      } else {
        toast({
          title: "Error",
          description: "Failed to create organization",
          variant: "destructive",
        });
      }
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiRequest("DELETE", `/api/organizations/${orgId}`);
      return response.json();
    },
    onSuccess: async () => {
      await refetchOrgs();
      toast({
        title: "Organization deleted",
        description: "The organization has been successfully deleted",
      });
      setOrgToDelete(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Permission denied",
          description: "You don't have permission to delete this organization",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete organization",
          variant: "destructive",
        });
      }
      setOrgToDelete(null);
    },
  });

  const onSubmit = handleSubmit((data: CreateOrgForm) => {
    createOrgMutation.mutate(data);
  });

  // Temporarily remove auth check to debug API calls
  console.log('Organizations component loaded, isAuthenticated:', isAuthenticated);
  console.log('Organizations data:', organizations);
  console.log('Is loading:', orgsLoading);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 pl-64">
        <Header />
        <main className="bg-gray-50 flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              {/* Title now handled by Header component */}
              <div></div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={onSubmit}>
                    <DialogHeader>
                      <DialogTitle>Create Organization</DialogTitle>
                      <DialogDescription>
                        Add a new organization to manage its GRC processes.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Organization Name</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Enter organization name"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          {...register("description")}
                          placeholder="Enter organization description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createOrgMutation.isPending}>
                        {createOrgMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {orgsLoading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <Card key={n} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org) => (
                  <Card key={org.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          {org.name}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOrgToDelete(org.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardDescription>{org.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Role: {org.role}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <AlertDialog open={!!orgToDelete} onOpenChange={(isOpen) => !isOpen && setOrgToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this organization? This action will also delete all associated data including documents, frameworks, and risks. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 hover:bg-red-600"
                  disabled={deleteOrgMutation.isPending}
                  onClick={() => orgToDelete && deleteOrgMutation.mutate(orgToDelete)}
                >
                  {deleteOrgMutation.isPending ? "Deleting..." : "Delete Organization"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}
