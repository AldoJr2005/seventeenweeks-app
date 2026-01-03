import {
  challenges, dayLogs, workoutLogs, weeklyPhotos, weeklyCheckIns, habitLogs, reminderLogs, userProfiles, appSettings, baselineSnapshots, weeklyReflections,
  type Challenge, type InsertChallenge,
  type DayLog, type InsertDayLog,
  type WorkoutLog, type InsertWorkoutLog,
  type WeeklyPhoto, type InsertWeeklyPhoto,
  type WeeklyCheckIn, type InsertWeeklyCheckIn,
  type HabitLog, type InsertHabitLog,
  type ReminderLog, type InsertReminderLog,
  type UserProfile, type InsertUserProfile,
  type AppSettings, type InsertAppSettings,
  type BaselineSnapshot, type InsertBaselineSnapshot,
  type WeeklyReflection, type InsertWeeklyReflection,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Challenge
  getChallenge(): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, challenge: Partial<InsertChallenge>): Promise<Challenge | undefined>;
  
  // Day Logs (nutrition)
  getDayLog(date: string): Promise<DayLog | undefined>;
  getDayLogs(challengeId: string): Promise<DayLog[]>;
  createDayLog(dayLog: InsertDayLog): Promise<DayLog>;
  updateDayLog(id: string, dayLog: Partial<InsertDayLog>): Promise<DayLog | undefined>;
  
  // Workout Logs
  getWorkoutLog(date: string): Promise<WorkoutLog | undefined>;
  getWorkoutLogs(challengeId: string): Promise<WorkoutLog[]>;
  createWorkoutLog(workoutLog: InsertWorkoutLog): Promise<WorkoutLog>;
  updateWorkoutLog(id: string, workoutLog: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined>;
  
  // Weekly Photos
  getWeeklyPhoto(weekNumber: number): Promise<WeeklyPhoto | undefined>;
  getWeeklyPhotos(challengeId: string): Promise<WeeklyPhoto[]>;
  createWeeklyPhoto(photo: InsertWeeklyPhoto): Promise<WeeklyPhoto>;
  updateWeeklyPhoto(id: string, photo: Partial<InsertWeeklyPhoto>): Promise<WeeklyPhoto | undefined>;
  
  // Weekly Check-ins
  getWeeklyCheckIn(weekNumber: number): Promise<WeeklyCheckIn | undefined>;
  getWeeklyCheckIns(challengeId: string): Promise<WeeklyCheckIn[]>;
  createWeeklyCheckIn(checkIn: InsertWeeklyCheckIn): Promise<WeeklyCheckIn>;
  updateWeeklyCheckIn(id: string, checkIn: Partial<InsertWeeklyCheckIn>): Promise<WeeklyCheckIn | undefined>;
  
  // Habit Logs
  getHabitLog(date: string): Promise<HabitLog | undefined>;
  getHabitLogs(challengeId: string): Promise<HabitLog[]>;
  createHabitLog(habitLog: InsertHabitLog): Promise<HabitLog>;
  updateHabitLog(id: string, habitLog: Partial<InsertHabitLog>): Promise<HabitLog | undefined>;
  
  // Reminder Logs
  getReminderLogs(challengeId: string): Promise<ReminderLog[]>;
  createReminderLog(reminderLog: InsertReminderLog): Promise<ReminderLog>;
  
  // User Profile
  getUserProfile(): Promise<UserProfile | undefined>;
  getUserProfileByUsername(username: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  deleteUserProfile(id: string): Promise<void>;
  
  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  createAppSettings(settings: InsertAppSettings): Promise<AppSettings>;
  updateAppSettings(id: string, settings: Partial<InsertAppSettings>): Promise<AppSettings | undefined>;
  
  // Baseline Snapshots
  getBaselineSnapshot(challengeId: string): Promise<BaselineSnapshot | undefined>;
  createBaselineSnapshot(snapshot: InsertBaselineSnapshot): Promise<BaselineSnapshot>;
  updateBaselineSnapshot(id: string, snapshot: Partial<InsertBaselineSnapshot>): Promise<BaselineSnapshot | undefined>;
  
  // Weekly Reflections
  getWeeklyReflection(challengeId: string, weekNumber: number): Promise<WeeklyReflection | undefined>;
  getWeeklyReflections(challengeId: string): Promise<WeeklyReflection[]>;
  createWeeklyReflection(reflection: InsertWeeklyReflection): Promise<WeeklyReflection>;
  updateWeeklyReflection(id: string, reflection: Partial<InsertWeeklyReflection>): Promise<WeeklyReflection | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Challenge
  async getChallenge(): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).limit(1);
    return challenge || undefined;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [created] = await db.insert(challenges).values(challenge).returning();
    return created;
  }

  async updateChallenge(id: string, challenge: Partial<InsertChallenge>): Promise<Challenge | undefined> {
    const [updated] = await db.update(challenges).set(challenge).where(eq(challenges.id, id)).returning();
    return updated || undefined;
  }

  // Day Logs
  async getDayLog(date: string): Promise<DayLog | undefined> {
    const [log] = await db.select().from(dayLogs).where(eq(dayLogs.date, date));
    return log || undefined;
  }

  async getDayLogs(challengeId: string): Promise<DayLog[]> {
    return db.select().from(dayLogs).where(eq(dayLogs.challengeId, challengeId)).orderBy(desc(dayLogs.date));
  }

  async createDayLog(dayLog: InsertDayLog): Promise<DayLog> {
    const [created] = await db.insert(dayLogs).values(dayLog).returning();
    return created;
  }

  async updateDayLog(id: string, dayLog: Partial<InsertDayLog>): Promise<DayLog | undefined> {
    const [updated] = await db.update(dayLogs).set({ ...dayLog, updatedAt: new Date() }).where(eq(dayLogs.id, id)).returning();
    return updated || undefined;
  }

  // Workout Logs
  async getWorkoutLog(date: string): Promise<WorkoutLog | undefined> {
    const [log] = await db.select().from(workoutLogs).where(eq(workoutLogs.date, date));
    return log || undefined;
  }

  async getWorkoutLogs(challengeId: string): Promise<WorkoutLog[]> {
    return db.select().from(workoutLogs).where(eq(workoutLogs.challengeId, challengeId)).orderBy(desc(workoutLogs.date));
  }

  async createWorkoutLog(workoutLog: InsertWorkoutLog): Promise<WorkoutLog> {
    const [created] = await db.insert(workoutLogs).values(workoutLog).returning();
    return created;
  }

  async updateWorkoutLog(id: string, workoutLog: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const [updated] = await db.update(workoutLogs).set({ ...workoutLog, updatedAt: new Date() }).where(eq(workoutLogs.id, id)).returning();
    return updated || undefined;
  }

  // Weekly Photos
  async getWeeklyPhoto(weekNumber: number): Promise<WeeklyPhoto | undefined> {
    const [photo] = await db.select().from(weeklyPhotos).where(eq(weeklyPhotos.weekNumber, weekNumber));
    return photo || undefined;
  }

  async getWeeklyPhotos(challengeId: string): Promise<WeeklyPhoto[]> {
    return db.select().from(weeklyPhotos).where(eq(weeklyPhotos.challengeId, challengeId)).orderBy(asc(weeklyPhotos.weekNumber));
  }

  async createWeeklyPhoto(photo: InsertWeeklyPhoto): Promise<WeeklyPhoto> {
    const [created] = await db.insert(weeklyPhotos).values(photo).returning();
    return created;
  }

  async updateWeeklyPhoto(id: string, photo: Partial<InsertWeeklyPhoto>): Promise<WeeklyPhoto | undefined> {
    const [updated] = await db.update(weeklyPhotos).set(photo).where(eq(weeklyPhotos.id, id)).returning();
    return updated || undefined;
  }

  // Weekly Check-ins
  async getWeeklyCheckIn(weekNumber: number): Promise<WeeklyCheckIn | undefined> {
    const [checkIn] = await db.select().from(weeklyCheckIns).where(eq(weeklyCheckIns.weekNumber, weekNumber));
    return checkIn || undefined;
  }

  async getWeeklyCheckIns(challengeId: string): Promise<WeeklyCheckIn[]> {
    return db.select().from(weeklyCheckIns).where(eq(weeklyCheckIns.challengeId, challengeId)).orderBy(asc(weeklyCheckIns.weekNumber));
  }

  async createWeeklyCheckIn(checkIn: InsertWeeklyCheckIn): Promise<WeeklyCheckIn> {
    const [created] = await db.insert(weeklyCheckIns).values(checkIn).returning();
    return created;
  }

  async updateWeeklyCheckIn(id: string, checkIn: Partial<InsertWeeklyCheckIn>): Promise<WeeklyCheckIn | undefined> {
    const [updated] = await db.update(weeklyCheckIns).set({ ...checkIn, updatedAt: new Date() }).where(eq(weeklyCheckIns.id, id)).returning();
    return updated || undefined;
  }

  // Habit Logs
  async getHabitLog(date: string): Promise<HabitLog | undefined> {
    const [log] = await db.select().from(habitLogs).where(eq(habitLogs.date, date));
    return log || undefined;
  }

  async getHabitLogs(challengeId: string): Promise<HabitLog[]> {
    return db.select().from(habitLogs).where(eq(habitLogs.challengeId, challengeId)).orderBy(desc(habitLogs.date));
  }

  async createHabitLog(habitLog: InsertHabitLog): Promise<HabitLog> {
    const [created] = await db.insert(habitLogs).values(habitLog).returning();
    return created;
  }

  async updateHabitLog(id: string, habitLog: Partial<InsertHabitLog>): Promise<HabitLog | undefined> {
    const [updated] = await db.update(habitLogs).set({ ...habitLog, updatedAt: new Date() }).where(eq(habitLogs.id, id)).returning();
    return updated || undefined;
  }

  // Reminder Logs
  async getReminderLogs(challengeId: string): Promise<ReminderLog[]> {
    return db.select().from(reminderLogs).where(eq(reminderLogs.challengeId, challengeId)).orderBy(desc(reminderLogs.createdAt));
  }

  async createReminderLog(reminderLog: InsertReminderLog): Promise<ReminderLog> {
    const [created] = await db.insert(reminderLogs).values(reminderLog).returning();
    return created;
  }

  // User Profile
  async getUserProfile(): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).limit(1);
    return profile || undefined;
  }

  async getUserProfileByUsername(username: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.username, username));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }

  async updateUserProfile(id: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db.update(userProfiles).set({ ...profile, updatedAt: new Date() }).where(eq(userProfiles.id, id)).returning();
    return updated || undefined;
  }

  async deleteUserProfile(id: string): Promise<void> {
    await db.delete(userProfiles).where(eq(userProfiles.id, id));
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings || undefined;
  }

  async createAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const [created] = await db.insert(appSettings).values(settings).returning();
    return created;
  }

  async updateAppSettings(id: string, settings: Partial<InsertAppSettings>): Promise<AppSettings | undefined> {
    const [updated] = await db.update(appSettings).set({ ...settings, updatedAt: new Date() }).where(eq(appSettings.id, id)).returning();
    return updated || undefined;
  }

  // Baseline Snapshots
  async getBaselineSnapshot(challengeId: string): Promise<BaselineSnapshot | undefined> {
    const [snapshot] = await db.select().from(baselineSnapshots).where(eq(baselineSnapshots.challengeId, challengeId));
    return snapshot || undefined;
  }

  async createBaselineSnapshot(snapshot: InsertBaselineSnapshot): Promise<BaselineSnapshot> {
    const [created] = await db.insert(baselineSnapshots).values(snapshot).returning();
    return created;
  }

  async updateBaselineSnapshot(id: string, snapshot: Partial<InsertBaselineSnapshot>): Promise<BaselineSnapshot | undefined> {
    const [updated] = await db.update(baselineSnapshots).set(snapshot).where(eq(baselineSnapshots.id, id)).returning();
    return updated || undefined;
  }

  // Weekly Reflections
  async getWeeklyReflection(challengeId: string, weekNumber: number): Promise<WeeklyReflection | undefined> {
    const [reflection] = await db.select().from(weeklyReflections)
      .where(and(eq(weeklyReflections.challengeId, challengeId), eq(weeklyReflections.weekNumber, weekNumber)));
    return reflection || undefined;
  }

  async getWeeklyReflections(challengeId: string): Promise<WeeklyReflection[]> {
    return db.select().from(weeklyReflections).where(eq(weeklyReflections.challengeId, challengeId)).orderBy(asc(weeklyReflections.weekNumber));
  }

  async createWeeklyReflection(reflection: InsertWeeklyReflection): Promise<WeeklyReflection> {
    const [created] = await db.insert(weeklyReflections).values(reflection).returning();
    return created;
  }

  async updateWeeklyReflection(id: string, reflection: Partial<InsertWeeklyReflection>): Promise<WeeklyReflection | undefined> {
    const [updated] = await db.update(weeklyReflections).set({ ...reflection, updatedAt: new Date() }).where(eq(weeklyReflections.id, id)).returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
