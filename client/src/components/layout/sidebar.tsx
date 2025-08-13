import { Link, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Home, 
  FileText, 
  AlertTriangle, 
  Clipboard, 
  Upload, 
  Users 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  organizations: any[];
  selectedOrgId?: string;
  onOrgChange?: (orgId: string) => void;
}

export default function Sidebar({ organizations, selectedOrgId, onOrgChange }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Risk Register", href: "/risks", icon: AlertTriangle },
    { name: "Frameworks", href: "/frameworks", icon: Clipboard },
    { name: "Import/Export", href: "/import-export", icon: Upload },
    { name: "Users & Roles", href: "/users", icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
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
        <div className="p-4 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">Current Organization</label>
          <Select value={selectedOrgId} onValueChange={onOrgChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.name} href={item.href}>
              <div 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  active 
                    ? "bg-blue-50 text-primary font-medium" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                data-testid={`nav-${item.href === "/" ? "dashboard" : item.href.substring(1).replace("/", "-")}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Organizations Link */}
      <div className="px-4">
        <Link href="/organizations">
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

      {/* User Role Badge */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-xs font-medium text-gray-700">Current Role</div>
          <div className="text-sm font-semibold text-primary">
            {selectedOrg?.role 
              ? selectedOrg.role.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
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
