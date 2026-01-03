import { getApiUrl, apiRequest } from "@/lib/query-client";
import type {
  Challenge, InsertChallenge,
  DayLog, InsertDayLog,
  WorkoutLog, InsertWorkoutLog,
  WeeklyPhoto, InsertWeeklyPhoto,
  WeeklyCheckIn, InsertWeeklyCheckIn,
  HabitLog, InsertHabitLog,
  UserProfile, InsertUserProfile,
  AppSettings, InsertAppSettings,
} from "@shared/schema";

const BASE_URL = getApiUrl();

async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export const api = {
  challenge: {
    get: () => fetchApi<Challenge | null>("/api/challenge"),
    create: (data: InsertChallenge) => apiRequest<Challenge>("/api/challenge", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertChallenge>) => apiRequest<Challenge>(`/api/challenge/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  },
  
  dayLogs: {
    getAll: (challengeId: string) => fetchApi<DayLog[]>(`/api/day-logs?challengeId=${challengeId}`),
    getByDate: (date: string) => fetchApi<DayLog | null>(`/api/day-logs/${date}`),
    create: (data: InsertDayLog) => apiRequest<DayLog>("/api/day-logs", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertDayLog>) => apiRequest<DayLog>(`/api/day-logs/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  },
  
  workoutLogs: {
    getAll: (challengeId: string) => fetchApi<WorkoutLog[]>(`/api/workout-logs?challengeId=${challengeId}`),
    getByDate: (date: string) => fetchApi<WorkoutLog | null>(`/api/workout-logs/${date}`),
    create: (data: InsertWorkoutLog) => apiRequest<WorkoutLog>("/api/workout-logs", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertWorkoutLog>) => apiRequest<WorkoutLog>(`/api/workout-logs/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  },
  
  weeklyPhotos: {
    getAll: (challengeId: string) => fetchApi<WeeklyPhoto[]>(`/api/weekly-photos?challengeId=${challengeId}`),
    getByWeek: (weekNumber: number) => fetchApi<WeeklyPhoto | null>(`/api/weekly-photos/${weekNumber}`),
    create: (data: InsertWeeklyPhoto) => apiRequest<WeeklyPhoto>("/api/weekly-photos", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertWeeklyPhoto>) => apiRequest<WeeklyPhoto>(`/api/weekly-photos/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  },
  
  weeklyCheckIns: {
    getAll: (challengeId: string) => fetchApi<WeeklyCheckIn[]>(`/api/weekly-check-ins?challengeId=${challengeId}`),
    getByWeek: (weekNumber: number) => fetchApi<WeeklyCheckIn | null>(`/api/weekly-check-ins/${weekNumber}`),
    create: (data: InsertWeeklyCheckIn) => apiRequest<WeeklyCheckIn>("/api/weekly-check-ins", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertWeeklyCheckIn>) => apiRequest<WeeklyCheckIn>(`/api/weekly-check-ins/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  },
  
  habitLogs: {
    getAll: (challengeId: string) => fetchApi<HabitLog[]>(`/api/habit-logs?challengeId=${challengeId}`),
    getByDate: (date: string) => fetchApi<HabitLog | null>(`/api/habit-logs/${date}`),
    create: (data: InsertHabitLog) => apiRequest<HabitLog>("/api/habit-logs", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertHabitLog>) => apiRequest<HabitLog>(`/api/habit-logs/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  },
  
  settings: {
    get: () => fetchApi<AppSettings | null>("/api/settings"),
    create: (data: InsertAppSettings) => apiRequest<AppSettings>("/api/settings", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertAppSettings>) => apiRequest<AppSettings>(`/api/settings/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  },
  
  profile: {
    get: () => fetchApi<UserProfile | null>("/api/profile"),
    create: (data: InsertUserProfile) => apiRequest<UserProfile>("/api/profile", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    update: (id: string, data: Partial<InsertUserProfile>) => apiRequest<UserProfile>(`/api/profile/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    delete: (id: string) => apiRequest<void>(`/api/profile/${id}`, { method: "DELETE" }),
    verifyPassword: (passwordHash: string) => apiRequest<{ valid: boolean }>("/api/profile/verify-password", { method: "POST", body: JSON.stringify({ passwordHash }), headers: { "Content-Type": "application/json" } }),
  },
};
