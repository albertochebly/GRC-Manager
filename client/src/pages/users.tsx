import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users as UsersIcon, Mail, Calendar, MoreHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "contributor", "approver", "read-only"]),
});

type InviteUserForm = z.infer<typeof inviteUserSchema>;

export default function Users() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
  });

  // Get user organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: isAuthenticated && !isLoading,
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

  // Set default organization
  useState(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  });

  // Get organization users
  const { data: orgUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrgId, "users"],
    enabled: !!selectedOrgId,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserForm) => {
      // In a real implementation, this would send an invitation email
      toast({
        title: "Feature Coming Soon",
        description: "User invitation functionality will be implemented in a future update.",
        variant: "default",
      });
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", selectedOrgId, "users"] });
      setIsDialogOpen(false);
      reset();
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
        description: "Failed to invite user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteUserForm) => {
    inviteUserMutation.mutate(data);
  };

  const getRoleBadge = (role: string) => {
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
  };

  const getInitials = (user: any) => {
    const firstName = user.user.firstName || "";
    const lastName = user.user.lastName || "";
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "?";
  };

  const getDisplayName = (user: any) => {
    const firstName = user.user.firstName || "";
    const lastName = user.user.lastName || "";
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : user.user.email;
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
    <div className="min-h-screen flex bg-gray-50" data-testid="users-page">
      <Sidebar 
        organizations={organizations} 
        selectedOrgId={selectedOrgId}
        onOrgChange={setSelectedOrgId}
      />
      
      <div className="flex-1 ml-64">
        <Header />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
              <p className="text-gray-600 mt-2">Manage user access and permissions for your organization</p>
            </div>
            
            {selectedOrgId && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-invite-user">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Invite New User</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join this organization with the specified role.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div>
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

          {!selectedOrgId ? (
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
                {orgUsers.length === 0 ? (
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
                      {orgUsers.map((orgUser: any) => (
                        <TableRow key={orgUser.id} data-testid={`row-user-${orgUser.userId}`}>
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
                              {format(new Date(orgUser.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" data-testid={`button-manage-user-${orgUser.userId}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
