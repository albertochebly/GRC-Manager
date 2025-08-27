import { Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import RoleProtectedRoute from "@/components/layout/RoleProtectedRoute";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Organizations from "@/pages/organizations";
import Documents from "@/pages/documents";
import RiskRegister from "@/pages/risk-register";
import Frameworks from "@/pages/frameworks";
import ImportExport from "@/pages/import-export";
import Users from "@/pages/users";
import MaturityAssessment from "@/pages/maturity-assessment";
// ...existing code...

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <TooltipProvider>
  <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            !isAuthenticated 
              ? <Landing /> 
              : <Navigate to="/dashboard" replace />
          } 
        />

  {/* Protected routes */}
  // ...existing code...
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/risk-register" element={<ProtectedRoute><RiskRegister /></ProtectedRoute>} />
        <Route path="/maturity-assessment" element={<ProtectedRoute><MaturityAssessment /></ProtectedRoute>} />
        
        {/* Admin-only routes */}
        <Route 
          path="/organizations" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute adminOnly={true}>
                <Organizations />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/frameworks" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute adminOnly={true}>
                <Frameworks />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/import-export" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute adminOnly={true}>
                <ImportExport />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute adminOnly={true}>
                <Users />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
