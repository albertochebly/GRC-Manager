import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response:", await response.text());
        throw new Error("Invalid response from server");
      }

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        const errorMessage = data?.message || "Failed to sign in";
        console.error('Login failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Use navigate instead of window.location to stay on the Vite dev server
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white overflow-hidden">
      {/* Main Content */}
      <div className="flex h-full">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white h-full text-center ml-16 -mt-8">
            {/* George Logo */}
            <div className="mb-8">
              <img 
                src="/george.png" 
                alt="George" 
                className="h-80 w-auto opacity-90"
              />
            </div>
            
            {/* Text Content */}
            <div className="max-w-lg">
              <h1 className="text-4xl font-light mb-6 leading-tight">
                Enterprise Governance,<br />
                Risk & Compliance
              </h1>
              <p className="text-xl text-slate-300 font-light leading-relaxed mb-8">
                Streamline your organization's risk management and compliance processes with enterprise-grade solutions.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-slate-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  ISO 27001
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  PCI DSS
                </span>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/5 to-blue-500/5 rounded-full transform -translate-x-48 translate-y-48"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 h-full">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-gray-900 mb-2">
                Sign In
              </h2>
              <p className="text-gray-600 font-light">
                Access your GRC management platform
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-email"
                  autoComplete="username"
                  className="h-12 px-4 border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ '--tw-ring-color': '#3C4279' } as React.CSSProperties}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-password"
                  autoComplete="current-password"
                  className="h-12 px-4 border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ '--tw-ring-color': '#3C4279' } as React.CSSProperties}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-white font-medium transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: '#3C4279' }}
                disabled={isLoading}
                data-testid="button-sign-in"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Protected by enterprise-grade security<br />
                <span className="text-gray-400">© 2025 AuditAlign. All rights reserved.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
