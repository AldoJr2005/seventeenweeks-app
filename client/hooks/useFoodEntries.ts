import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FoodEntry, InsertFoodEntry } from "@shared/schema";

export function useFoodEntries(challengeId: string | undefined, date: string) {
  return useQuery<FoodEntry[]>({
    queryKey: ["/api/food-entries", { challengeId, date }],
    queryFn: async () => {
      if (!challengeId) return [];
      return api.foodEntries.getByDate(challengeId, date);
    },
    enabled: !!challengeId && !!date,
  });
}

export function useFoodEntriesByDateRange(
  challengeId: string | undefined,
  startDate: string,
  endDate: string
) {
  return useQuery<FoodEntry[]>({
    queryKey: ["/api/food-entries", { challengeId, startDate, endDate }],
    queryFn: async () => {
      if (!challengeId) return [];
      return api.foodEntries.getByDateRange(challengeId, startDate, endDate);
    },
    enabled: !!challengeId && !!startDate && !!endDate,
  });
}

export function useCreateFoodEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertFoodEntry) => api.foodEntries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"], exact: false });
    },
  });
}

export function useUpdateFoodEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertFoodEntry> }) => 
      api.foodEntries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"], exact: false });
    },
  });
}

export function useDeleteFoodEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.foodEntries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"], exact: false });
    },
  });
}
