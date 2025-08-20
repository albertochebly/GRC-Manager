import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine page title and description based on current route
  const getPageInfo = () => {
    const pathname = location.pathname;
    
    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Dashboard Overview',
          description: 'Monitor compliance status across all active frameworks'
        };
      case '/documents':
        return {
          title: 'Document Management',
          description: 'Manage policies, procedures, and compliance documentation'
        };
      case '/frameworks':
        return {
          title: 'Compliance Frameworks',
          description: 'Configure and manage your compliance frameworks'
        };
      case '/risk-register':
        return {
          title: 'Risk Register',
          description: 'Identify, assess, and manage organizational risks'
        };
      case '/organizations':
        return {
          title: 'Organizations',
          description: 'Manage your organizations and team members'
        };
      case '/users':
        return {
          title: 'User Management',
          description: 'Manage user accounts and permissions'
        };
      case '/import-export':
        return {
          title: 'Import & Export',
          description: 'Import and export compliance data'
        };
      default:
        return {
          title: 'AuditAlign',
          description: 'GRC Management System'
        };
    }
  };

  const { title, description } = getPageInfo();
  
  const clearClientState = async () => {
    // Cancel all pending queries
    queryClient.cancelQueries();
    
    // Clear all client-side state
    queryClient.clear();
    queryClient.resetQueries();
    localStorage.clear();
    sessionStorage.clear();
    
    // Set user to null immediately to prevent further API calls
    queryClient.setQueryData(["/api/auth/user"], null);
    
    // Small delay to ensure state is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const handleLogout = async () => {
    try {
      // Clear client state first to prevent any pending requests
      await clearClientState();

      // Call logout endpoint
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      const data = await response.json();
      
      // Clear any remaining client state
      await clearClientState();
      
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
      
      // Redirect based on environment
      if (data.logoutUrl) {
        // In production, redirect to Replit's logout URL
        window.location.href = data.logoutUrl;
      } else {
        // In development, redirect to login page
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // If anything fails, force clear state and redirect to login
      await clearClientState();
      window.location.href = "/login";
    }
  };

  const getUserInitials = () => {
    if (!user) return "?";
    // Try claims first, fall back to top-level properties
    const firstName = user.claims?.first_name || user.firstName || "";
    const lastName = user.claims?.last_name || user.lastName || "";
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.claims?.email?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    // Try claims first, fall back to top-level properties
    const firstName = user.claims?.first_name || user.firstName || "";
    const lastName = user.claims?.last_name || user.lastName || "";
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : user.claims?.email || user.email || "User";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4" data-testid="header">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{getUserInitials()}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
              <div className="text-xs text-gray-600">{user?.email}</div>
            </div>
          </div>

          {/* Logout Button */}
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
