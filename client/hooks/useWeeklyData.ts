import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsertWeeklyPhoto, InsertWeeklyCheckIn } from "@shared/schema";

export function useWeeklyPhotos(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/weekly-photos", challengeId],
    enabled: !!challengeId,
  });
}

export function useCreateWeeklyPhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertWeeklyPhoto) => api.weeklyPhotos.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-photos"] });
    },
  });
}

export function useUpdateWeeklyPhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertWeeklyPhoto> }) => api.weeklyPhotos.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-photos"] });
    },
  });
}

export function useWeeklyCheckIns(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/weekly-check-ins", challengeId],
    enabled: !!challengeId,
  });
}

export function useCreateWeeklyCheckIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertWeeklyCheckIn) => api.weeklyCheckIns.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-check-ins"] });
    },
  });
}

export function useUpdateWeeklyCheckIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertWeeklyCheckIn> }) => api.weeklyCheckIns.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-check-ins"] });
    },
  });
}
