import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsertWorkoutLog } from "@shared/schema";

export function useWorkoutLogs(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/workout-logs", challengeId],
    enabled: !!challengeId,
  });
}

export function useWorkoutLog(date: string) {
  return useQuery({
    queryKey: ["/api/workout-logs", date],
  });
}

export function useCreateWorkoutLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertWorkoutLog) => api.workoutLogs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
    },
  });
}

export function useUpdateWorkoutLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertWorkoutLog> }) => api.workoutLogs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
    },
  });
}
