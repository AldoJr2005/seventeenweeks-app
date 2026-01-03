import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { InsertWeeklyReflection } from "@shared/schema";

export function useWeeklyReflections(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/reflections", challengeId],
    enabled: !!challengeId,
    queryFn: async () => {
      if (!challengeId) return [];
      const url = new URL(`/api/reflections?challengeId=${challengeId}`, getApiUrl()).toString();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch reflections");
      return response.json();
    },
  });
}

export function useWeeklyReflection(challengeId: string | undefined, weekNumber: number) {
  return useQuery({
    queryKey: ["/api/reflections", challengeId, weekNumber],
    enabled: !!challengeId,
    queryFn: async () => {
      if (!challengeId) return null;
      const url = new URL(`/api/reflections/${challengeId}/${weekNumber}`, getApiUrl()).toString();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch reflection");
      return response.json();
    },
  });
}

export function useCreateWeeklyReflection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertWeeklyReflection) => {
      const response = await apiRequest("POST", "/api/reflections", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reflections", variables.challengeId], exact: false });
    },
  });
}

export function useUpdateWeeklyReflection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertWeeklyReflection> }) => {
      const response = await apiRequest("PATCH", `/api/reflections/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reflections"], exact: false });
    },
  });
}
