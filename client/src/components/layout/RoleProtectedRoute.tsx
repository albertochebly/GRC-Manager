import { Navigate } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizations";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  adminOnly?: boolean;
}

const RoleProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  adminOnly = false 
}: RoleProtectedRouteProps) => {
  const { selectedOrganization } = useOrganizations();
  const userRole = selectedOrganization?.role;

  // If adminOnly is true, only allow admin access
  if (adminOnly) {
    if (userRole !== "admin" && userRole !== undefined) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // If allowedRoles is specified, check if user role is in the list
  if (allowedRoles.length > 0) {
    if (userRole && !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
