import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest } from "@shared/routes";
import { useLocation } from "wouter";
import { trackFetch as fetch, setTrackIdentity } from "@/lib/track-context";

export function useAuth() {
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();

  const userQuery = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) { setTrackIdentity(null); return null; }
      if (!res.ok) throw new Error("Failed to fetch user");
      const user = api.auth.me.responses[200].parse(await res.json());
      setTrackIdentity(user);
      return user;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid credentials");
        throw new Error("Login failed");
      }
      const user = api.auth.login.responses[200].parse(await res.json());
      setTrackIdentity(user);
      return user;
    },
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { 
        method: "POST", 
        credentials: "include" 
      });
    },
    onSuccess: () => {
      setTrackIdentity(null);
      queryClient.clear();
      setLocation("/login");
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}
