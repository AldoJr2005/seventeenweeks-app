import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsertBaselineSnapshot } from "@shared/schema";

export function useBaselineSnapshot(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/baseline", challengeId],
    queryFn: () => api.baselineSnapshots.get(challengeId!),
    enabled: !!challengeId,
  });
}

export function useCreateBaselineSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertBaselineSnapshot) => api.baselineSnapshots.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/baseline", variables.challengeId] });
    },
  });
}

export function useUpdateBaselineSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertBaselineSnapshot> }) => 
      api.baselineSnapshots.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baseline"] });
    },
  });
}
