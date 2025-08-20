import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users as UsersIcon, Mail, Calendar, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "contributor", "approver", "read-only"]),
});

const editUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "contributor", "approver", "read-only"]),
});

type InviteUserForm = z.infer<typeof inviteUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

export default function Users() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedOrganizationId } = useOrganizations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserForm) => {
      if (!selectedOrganizationId) throw new Error("No organization selected");
      const response = await apiRequest(
        "POST",
        `/api/organizations/${selectedOrganizationId}/users/invite`,
        data
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to invite user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User invitation sent successfully",
      });
      setIsDialogOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrganizationId, "users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteUserForm) => {
    inviteUserMutation.mutate(data);
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
  });

  // Separate form for editing users
  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    setValue: editSetValue,
    formState: { errors: editErrors },
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  // Reset edit form when editing user
  useEffect(() => {
    if (selectedUser) {
      editReset({
        email: selectedUser.user.email,
        firstName: selectedUser.user.firstName,
        lastName: selectedUser.user.lastName,
        role: selectedUser.role
      });
    } else {
      editReset({});
    }
  }, [selectedUser, editReset]);

  // Get organization users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/organizations", selectedOrganizationId, "users"],
    enabled: isAuthenticated && !isLoading && !!selectedOrganizationId,
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

  // Get organization users
  const { data: orgUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrganizationId, "users"],
    enabled: !!selectedOrganizationId,
    queryFn: async () => {
      try {
        console.log('Fetching users for org:', selectedOrganizationId);
        const response = await apiRequest("GET", `/api/organizations/${selectedOrganizationId}/users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        console.log('Fetched users:', data);
        return data;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      if (!selectedOrganizationId || !selectedUser?.user?.id) {
        throw new Error("Missing organization or user ID");
      }
      
      // Only include password if it's provided and not empty
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role
      };
      
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password;
      }
      
      console.log('Sending update:', updateData);
      
      const response = await apiRequest(
        "PUT",
        `/api/organizations/${selectedOrganizationId}/users/${selectedUser.user.id}`,
        updateData
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      const result = await response.json();
      console.log('Update response:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrganizationId, "users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Delete mutation called with:', { userId, selectedOrganizationId });
      if (!selectedOrganizationId || !userId) {
        console.error('Invalid data for deletion:', { selectedOrganizationId, userId });
        throw new Error("Invalid data");
      }
      const response = await apiRequest(
        "DELETE",
        `/api/organizations/${selectedOrganizationId}/users/${userId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return { userId };
    },
    onSuccess: (data) => {
      // Update the cache directly instead of invalidating to avoid refetch
      queryClient.setQueryData(
        ["/api/organizations", selectedOrganizationId, "users"],
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter((user: any) => user.user.id !== data.userId);
        }
      );
      
      toast({
        title: "Success",
        description: "User deleted successfully",
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

  // Memoize functions to prevent unnecessary re-renders
  const handleDeleteUser = useCallback((userId: string) => {
    console.log('Delete user called with:', { userId, selectedOrganizationId });
    deleteUserMutation.mutate(userId);
  }, [deleteUserMutation, selectedOrganizationId]);

  const getRoleBadge = useCallback((role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-blue-100 text-blue-800",
      contributor: "bg-green-100 text-green-800",
      approver: "bg-purple-100 text-purple-800",
      "read-only": "bg-gray-100 text-gray-800",
    };
    
    return (
      <Badge className={colors[role]}>
        {role.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  }, []);

  const getInitials = useCallback((user: any) => {
    const firstName = user.user.firstName || "";
    const lastName = user.user.lastName || "";
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "?";
  }, []);

  const getDisplayName = useCallback((user: any) => {
    const firstName = user.user.firstName || "";
    const lastName = user.user.lastName || "";
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : user.user.email;
  }, []);

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
    <div className="min-h-screen flex bg-gray-50" data-testid="users-page">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              {/* Title and description now handled by Header component */}
            </div>
            
            {selectedOrganizationId && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-invite-user">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit((data) => inviteUserMutation.mutate(data))}>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account and add them to this organization.
```
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="user@example.com"
                          data-testid="input-user-email"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            {...register("firstName")}
                            placeholder="John"
                            data-testid="input-first-name"
                          />
                          {errors.firstName && (
                            <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            {...register("lastName")}
                            placeholder="Doe"
                            data-testid="input-last-name"
                          />
                          {errors.lastName && (
                            <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...register("password")}
                          placeholder="••••••••"
                          data-testid="input-password"
                        />
                        {errors.password && (
                          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select onValueChange={(value: any) => setValue("role", value)}>
                          <SelectTrigger data-testid="select-user-role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="contributor">Contributor</SelectItem>
                            <SelectItem value="approver">Approver</SelectItem>
                            <SelectItem value="read-only">Read Only</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.role && (
                          <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={inviteUserMutation.isPending}
                        data-testid="button-send-invitation"
                      >
                        {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!selectedOrganizationId ? (
            <Card>
              <CardContent className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
                <p className="text-gray-600">Choose an organization to manage its users and roles.</p>
              </CardContent>
            </Card>
          ) : usersLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Organization Members</CardTitle>
                <CardDescription>
                  Users with access to this organization and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(!orgUsers || orgUsers.length === 0) ? (
                  <div className="text-center py-12">
                    <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Yet</h3>
                    <p className="text-gray-600 mb-6">Start by inviting team members to join this organization.</p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-invite-first-user">
                          <Plus className="w-4 h-4 mr-2" />
                          Invite Your First User
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(orgUsers || []).map((orgUser: any) => (
                        <TableRow key={orgUser.user.id} data-testid={`row-user-${orgUser.user.id}`}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={orgUser.user.profileImageUrl} />
                                <AvatarFallback className="bg-primary text-white text-sm">
                                  {getInitials(orgUser)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{getDisplayName(orgUser)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 text-gray-400 mr-2" />
                              {orgUser.user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(orgUser.role)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              {(() => {
                                const dateValue = orgUser.user?.createdAt || orgUser.createdAt;
                                try {
                                  const date = new Date(dateValue);
                                  return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, yyyy');
                                } catch (error) {
                                  return 'Invalid date';
                                }
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" data-testid={`button-manage-user-${orgUser.userId}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUser(orgUser);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this user?")) {
                                      handleDeleteUser(orgUser.user.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information and permissions.
                </DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <form onSubmit={editHandleSubmit((data) => {
                  console.log('Form data:', data);
                  editUserMutation.mutate(data);
                })}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        defaultValue={selectedUser.user.email}
                        {...editRegister("email")}
                        readOnly
                      />
                      {editErrors.email && (
                        <p className="text-sm text-red-500">{editErrors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-firstName">First Name</Label>
                        <Input
                          id="edit-firstName"
                          defaultValue={selectedUser.user.firstName}
                          {...editRegister("firstName")}
                        />
                        {editErrors.firstName && (
                          <p className="text-sm text-red-500">{editErrors.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="edit-lastName">Last Name</Label>
                        <Input
                          id="edit-lastName"
                          defaultValue={selectedUser.user.lastName}
                          {...editRegister("lastName")}
                        />
                        {editErrors.lastName && (
                          <p className="text-sm text-red-500">{editErrors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-password">New Password (optional)</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        {...editRegister("password")}
                        placeholder="Leave blank to keep current password"
                      />
                      {editErrors.password && (
                        <p className="text-sm text-red-500">{editErrors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-role">Role</Label>
                      <Select 
                        onValueChange={(value: any) => {
                          editSetValue("role", value);
                        }}
                        defaultValue={selectedUser.role}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="contributor">Contributor</SelectItem>
                          <SelectItem value="approver">Approver</SelectItem>
                          <SelectItem value="read-only">Read Only</SelectItem>
                        </SelectContent>
                      </Select>
                      {editErrors.role && (
                        <p className="text-sm text-red-500">{editErrors.role.message}</p>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setSelectedUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={editUserMutation.isPending}
                    >
                      {editUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
