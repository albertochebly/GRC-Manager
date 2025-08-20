import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  claims?: {
    sub: string;
    email: string;
    name: string;
    first_name?: string;
    last_name?: string;
  };
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          method: 'GET',
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          const error = await response.text();
          console.error('Auth error response:', error);
          throw new Error(error || "Failed to fetch user");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 0, // Don't cache
    gcTime: 0, // Don't keep in garbage collection
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
}
