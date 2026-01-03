import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HabitLog, InsertHabitLog } from "@shared/schema";

export function useHabitLogs(challengeId: string | undefined) {
  return useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", { challengeId }],
    queryFn: () => api.habitLogs.getAll(challengeId!),
    enabled: !!challengeId,
  });
}

export function useHabitLog(date: string) {
  return useQuery({
    queryKey: ["/api/habit-logs/date", date],
    queryFn: () => api.habitLogs.getByDate(date),
  });
}

export function useCreateHabitLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertHabitLog) => api.habitLogs.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/date", variables.date] });
    },
  });
}

export function useUpdateHabitLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertHabitLog> }) => api.habitLogs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"], exact: false });
    },
  });
}
