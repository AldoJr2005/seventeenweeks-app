import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getActiveProfileId } from "@/lib/auth";
import type { InsertUserProfile, UserProfile } from "@shared/schema";

export function useProfile() {
  const [profileId, setProfileId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    getActiveProfileId().then(setProfileId);
  }, []);
  
  return useQuery<UserProfile | null>({
    queryKey: ["/api/profile", profileId],
    queryFn: async () => {
      const id = await getActiveProfileId();
      if (id) {
        return api.profile.getById(id);
      }
      return api.profile.get();
    },
    enabled: profileId !== undefined,
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
    mutationFn: async (data: string | { passwordHash: string; profileId: string }) => {
      if (typeof data === "string") {
        return api.profile.verifyPassword(data);
      }
      return api.profile.verifyPassword(data.passwordHash, data.profileId);
    },
  });
}
