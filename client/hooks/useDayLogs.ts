import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsertDayLog } from "@shared/schema";

export function useDayLogs(challengeId: string | undefined) {
  return useQuery({
    queryKey: ["/api/day-logs", { challengeId }],
    queryFn: () => api.dayLogs.getAll(challengeId!),
    enabled: !!challengeId,
  });
}

export function useDayLog(date: string) {
  return useQuery({
    queryKey: ["/api/day-logs/date", date],
    queryFn: () => api.dayLogs.getByDate(date),
  });
}

export function useCreateDayLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertDayLog) => api.dayLogs.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-logs"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/day-logs/date", variables.date] });
    },
  });
}

export function useUpdateDayLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertDayLog> }) => api.dayLogs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-logs"], exact: false });
    },
  });
}
