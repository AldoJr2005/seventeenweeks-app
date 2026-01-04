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
  FoodEntry, InsertFoodEntry,
} from "@shared/schema";

const BASE_URL = getApiUrl();

// Timeout helper (5 seconds)
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    ),
  ]);
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  const response = await fetchWithTimeout(url.toString(), {}, 5000); // 5 second timeout
  if (!response.ok) {
    if (response.status === 404 && endpoint.includes("/api/profiles")) {
      return [] as T;
    }
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
    getByUserId: (userId: string) => fetchApi<Challenge | null>(`/api/challenge?userId=${userId}`),
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
    getById: (id: string) => fetchApi<UserProfile | null>(`/api/profile?profileId=${id}`),
    getAll: () => fetchApi<UserProfile[]>("/api/profiles"),
    create: (data: InsertUserProfile) => apiRequest<UserProfile>("POST", "/api/profile", data),
    update: (id: string, data: Partial<InsertUserProfile>) => apiRequest<UserProfile>("PATCH", `/api/profile/${id}`, data),
    delete: (id: string) => apiRequest<void>("DELETE", `/api/profile/${id}`),
    verifyPassword: (data: string | { passwordHash: string; profileId: string }) => {
      if (typeof data === "string") {
        return apiRequest<{ valid: boolean }>("POST", "/api/profile/verify-password", { passwordHash: data });
      }
      return apiRequest<{ valid: boolean }>("POST", "/api/profile/verify-password", data);
    },
    login: (username: string, passwordHash: string) => apiRequest<{ success: boolean; message?: string; profileId?: string }>("POST", "/api/profile/login", { username, passwordHash }),
    verifyResetContact: (username: string, email: string | undefined, phone: string | undefined) => apiRequest<{ success: boolean; error?: string; resetToken?: string }>("POST", "/api/profile/verify-reset-contact", { username, email, phone }),
    resetPassword: (resetToken: string, newPasswordHash: string) => apiRequest<{ success: boolean; error?: string; profileId?: string }>("POST", "/api/profile/reset-password", { resetToken, newPasswordHash }),
  },

  baselineSnapshots: {
    get: (challengeId: string) => fetchApi<BaselineSnapshot | null>(`/api/baseline/${challengeId}`),
    create: (data: InsertBaselineSnapshot) => apiRequest<BaselineSnapshot>("POST", "/api/baseline", data),
    update: (id: string, data: Partial<InsertBaselineSnapshot>) => apiRequest<BaselineSnapshot>("PATCH", `/api/baseline/${id}`, data),
  },

  foodEntries: {
    getByDate: (challengeId: string, date: string) => 
      fetchApi<FoodEntry[]>(`/api/food-entries?challengeId=${challengeId}&date=${date}`),
    getByDateRange: (challengeId: string, startDate: string, endDate: string) => 
      fetchApi<FoodEntry[]>(`/api/food-entries?challengeId=${challengeId}&startDate=${startDate}&endDate=${endDate}`),
    create: (data: InsertFoodEntry) => apiRequest<FoodEntry>("POST", "/api/food-entries", data),
    update: (id: string, data: Partial<InsertFoodEntry>) => apiRequest<FoodEntry>("PATCH", `/api/food-entries/${id}`, data),
    delete: (id: string) => apiRequest<void>("DELETE", `/api/food-entries/${id}`),
  },
};
