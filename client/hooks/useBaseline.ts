import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { InsertBaselineSnapshot } from "@shared/schema";

export function useBaselineSnapshot(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/baseline", challengeId],
    enabled: !!challengeId,
    queryFn: async () => {
      if (!challengeId) return null;
      const url = new URL(`/api/baseline/${challengeId}`, getApiUrl()).toString();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch baseline");
      return response.json();
    },
  });
}

export function useCreateBaselineSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertBaselineSnapshot) => {
      const response = await apiRequest("POST", "/api/baseline", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/baseline", variables.challengeId] });
    },
  });
}

export function useUpdateBaselineSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBaselineSnapshot> }) => {
      const response = await apiRequest("PATCH", `/api/baseline/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baseline"], exact: false });
    },
  });
}
