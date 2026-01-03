import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsertUserProfile, UserProfile } from "@shared/schema";

export function useProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertUserProfile) => api.profile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertUserProfile> }) => api.profile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.profile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });
}

export function useVerifyPassword() {
  return useMutation({
    mutationFn: (passwordHash: string) => api.profile.verifyPassword(passwordHash),
  });
}
