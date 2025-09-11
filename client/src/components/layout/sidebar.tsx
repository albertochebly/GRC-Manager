import { Link, useLocation } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Home, 
  FileText, 
  AlertTriangle, 
  Clipboard, 
  Upload, 
  Users,
  BarChart3,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationFrameworks } from "@/hooks/useOrganizationFrameworks";

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { organizations, selectedOrganization, selectedOrganizationId, setSelectedOrganizationId } = useOrganizations();
  const { isPCIDSSActive, isISO27001Active } = useOrganizationFrameworks();

  // Base navigation items
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Risk Register", href: "/risk-register", icon: AlertTriangle },
    { name: "Frameworks", href: "/frameworks", icon: Clipboard },
    { name: "Users & Roles", href: "/users", icon: Users },
  ];

  // Conditional navigation items based on activated frameworks
  const frameworkNavigation = [
    ...(isISO27001Active ? [{ name: "ISO27001 GAP Assessment", href: "/maturity-assessment", icon: BarChart3 }] : []),
    ...(isPCIDSSActive ? [{ name: "PCI DSS GAP Assessment", href: "/pci-dss-gap-assessment", icon: CreditCard }] : []),
  ];

  // Combine base navigation with framework-specific items
  const navigation = [
    ...baseNavigation.slice(0, 3), // Dashboard, Documents, Risk Register
    ...frameworkNavigation, // Framework-specific assessments
    ...baseNavigation.slice(3), // Frameworks, Users & Roles
  ];

  // Filter navigation items based on user role
  const getFilteredNavigation = () => {
    const userRole = selectedOrganization?.role;
    
    // For contributor, approver, and read-only roles, only show Dashboard, Documents, Risk Register, and Assessment pages
    if (userRole === "contributor" || userRole === "approver" || userRole === "read-only") {
      return navigation.filter(item => 
        item.href === "/dashboard" || 
        item.href === "/documents" || 
        item.href === "/risk-register" ||
        item.href === "/maturity-assessment" ||
        item.href === "/pci-dss-gap-assessment"
      );
    }
    
    // For admin and other roles, show all navigation items
    return navigation;
  };

  const filteredNavigation = getFilteredNavigation();

  // Check if user should see organizations link (only admins)
  const canAccessOrganizations = () => {
    const userRole = selectedOrganization?.role;
    return userRole === "admin" || !userRole; // Allow access for admin or when no role is set (super admin)
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const getUserInitials = () => {
    if (!user) return "?";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : user.email;
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-10">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">GRC Manager</h1>
            <p className="text-sm text-gray-600">Compliance Dashboard</p>
          </div>
        </div>
      </div>
      
            {/* Organization Selector */}
      {organizations.length > 0 && (
        <div className="px-4">
          <Select 
            value={selectedOrganizationId || undefined} 
            onValueChange={setSelectedOrganizationId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name} {org.role && <span className="text-xs text-gray-500">({org.role})</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.name} to={item.href}>
              <div 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  active 
                    ? "bg-blue-50 text-primary font-medium" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                data-testid={`nav-${item.href === "/dashboard" ? "dashboard" : item.href.substring(1).replace("/", "-")}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Organizations Link - Only for Admins */}
      {canAccessOrganizations() && (
        <div className="px-4">
          <Link to="/organizations">
            <div 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                isActive("/organizations") 
                  ? "bg-blue-50 text-primary font-medium" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              data-testid="nav-organizations"
            >
              <Shield className="w-5 h-5" />
              <span>Organizations</span>
            </div>
          </Link>
        </div>
      )}

      {/* User Role Badge */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-xs font-medium text-gray-700">Current Role</div>
          <div className="text-sm font-semibold text-primary">
            {selectedOrganization?.role 
              ? selectedOrganization.role.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
              : "Super Admin"
            }
          </div>
          <div className="flex items-center mt-2 space-x-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">{getUserInitials()}</span>
            </div>
            <div className="text-xs text-gray-600 truncate">
              {getUserDisplayName()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
