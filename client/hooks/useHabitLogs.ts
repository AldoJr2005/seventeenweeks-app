import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsertHabitLog } from "@shared/schema";

export function useHabitLogs(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/habit-logs", challengeId],
    enabled: !!challengeId,
  });
}

export function useHabitLog(date: string) {
  return useQuery({
    queryKey: ["/api/habit-logs", date],
  });
}

export function useCreateHabitLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertHabitLog) => api.habitLogs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
    },
  });
}

export function useUpdateHabitLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertHabitLog> }) => api.habitLogs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
    },
  });
}
