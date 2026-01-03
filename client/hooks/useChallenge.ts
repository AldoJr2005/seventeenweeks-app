import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Challenge, InsertChallenge } from "@shared/schema";

export function useChallenge() {
  return useQuery<Challenge | null>({
    queryKey: ["/api/challenge"],
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertChallenge) => api.challenge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenge"] });
    },
  });
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertChallenge> }) => api.challenge.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenge"] });
    },
  });
}
