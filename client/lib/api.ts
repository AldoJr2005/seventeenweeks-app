import { getApiUrl, apiRequest as apiRequestBase } from "@/lib/query-client";
import type {
  Challenge, InsertChallenge,
  DayLog, InsertDayLog,
  WorkoutLog, InsertWorkoutLog,
  WeeklyPhoto, InsertWeeklyPhoto,
  WeeklyCheckIn, InsertWeeklyCheckIn,
  HabitLog, InsertHabitLog,
  UserProfile, InsertUserProfile,
  AppSettings, InsertAppSettings,
  BaselineSnapshot, InsertBaselineSnapshot,
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

async function apiRequest<T>(method: string, route: string, data?: unknown): Promise<T> {
  const res = await apiRequestBase(method, route, data);
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  challenge: {
    get: () => fetchApi<Challenge | null>("/api/challenge"),
    create: (data: InsertChallenge) => apiRequest<Challenge>("POST", "/api/challenge", data),
    update: (id: string, data: Partial<InsertChallenge>) => apiRequest<Challenge>("PATCH", `/api/challenge/${id}`, data),
  },
  
  dayLogs: {
    getAll: (challengeId: string) => fetchApi<DayLog[]>(`/api/day-logs?challengeId=${challengeId}`),
    getByDate: (date: string) => fetchApi<DayLog | null>(`/api/day-logs/${date}`),
    create: (data: InsertDayLog) => apiRequest<DayLog>("POST", "/api/day-logs", data),
    update: (id: string, data: Partial<InsertDayLog>) => apiRequest<DayLog>("PATCH", `/api/day-logs/${id}`, data),
  },
  
  workoutLogs: {
    getAll: (challengeId: string) => fetchApi<WorkoutLog[]>(`/api/workout-logs?challengeId=${challengeId}`),
    getByDate: (date: string) => fetchApi<WorkoutLog | null>(`/api/workout-logs/${date}`),
    create: (data: InsertWorkoutLog) => apiRequest<WorkoutLog>("POST", "/api/workout-logs", data),
    update: (id: string, data: Partial<InsertWorkoutLog>) => apiRequest<WorkoutLog>("PATCH", `/api/workout-logs/${id}`, data),
  },
  
  weeklyPhotos: {
    getAll: (challengeId: string) => fetchApi<WeeklyPhoto[]>(`/api/weekly-photos?challengeId=${challengeId}`),
    getByWeek: (weekNumber: number) => fetchApi<WeeklyPhoto | null>(`/api/weekly-photos/${weekNumber}`),
    create: (data: InsertWeeklyPhoto) => apiRequest<WeeklyPhoto>("POST", "/api/weekly-photos", data),
    update: (id: string, data: Partial<InsertWeeklyPhoto>) => apiRequest<WeeklyPhoto>("PATCH", `/api/weekly-photos/${id}`, data),
  },
  
  weeklyCheckIns: {
    getAll: (challengeId: string) => fetchApi<WeeklyCheckIn[]>(`/api/weekly-check-ins?challengeId=${challengeId}`),
    getByWeek: (weekNumber: number) => fetchApi<WeeklyCheckIn | null>(`/api/weekly-check-ins/${weekNumber}`),
    create: (data: InsertWeeklyCheckIn) => apiRequest<WeeklyCheckIn>("POST", "/api/weekly-check-ins", data),
    update: (id: string, data: Partial<InsertWeeklyCheckIn>) => apiRequest<WeeklyCheckIn>("PATCH", `/api/weekly-check-ins/${id}`, data),
  },
  
  habitLogs: {
    getAll: (challengeId: string) => fetchApi<HabitLog[]>(`/api/habit-logs?challengeId=${challengeId}`),
    getByDate: (date: string) => fetchApi<HabitLog | null>(`/api/habit-logs/${date}`),
    create: (data: InsertHabitLog) => apiRequest<HabitLog>("POST", "/api/habit-logs", data),
    update: (id: string, data: Partial<InsertHabitLog>) => apiRequest<HabitLog>("PATCH", `/api/habit-logs/${id}`, data),
  },
  
  settings: {
    get: () => fetchApi<AppSettings | null>("/api/settings"),
    create: (data: InsertAppSettings) => apiRequest<AppSettings>("POST", "/api/settings", data),
    update: (id: string, data: Partial<InsertAppSettings>) => apiRequest<AppSettings>("PATCH", `/api/settings/${id}`, data),
  },
  
  profile: {
    get: () => fetchApi<UserProfile | null>("/api/profile"),
    create: (data: InsertUserProfile) => apiRequest<UserProfile>("POST", "/api/profile", data),
    update: (id: string, data: Partial<InsertUserProfile>) => apiRequest<UserProfile>("PATCH", `/api/profile/${id}`, data),
    delete: (id: string) => apiRequest<void>("DELETE", `/api/profile/${id}`),
    verifyPassword: (passwordHash: string) => apiRequest<{ valid: boolean }>("POST", "/api/profile/verify-password", { passwordHash }),
  },

  baselineSnapshots: {
    get: (challengeId: string) => fetchApi<BaselineSnapshot | null>(`/api/baseline/${challengeId}`),
    create: (data: InsertBaselineSnapshot) => apiRequest<BaselineSnapshot>("POST", "/api/baseline", data),
    update: (id: string, data: Partial<InsertBaselineSnapshot>) => apiRequest<BaselineSnapshot>("PATCH", `/api/baseline/${id}`, data),
  },
};
