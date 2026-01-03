import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Challenge table - stores the 17-week challenge configuration
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startDate: date("start_date").notNull(),
  startWeight: real("start_weight").notNull(),
  goalWeight: real("goal_weight"),
  unit: varchar("unit", { length: 10 }).notNull().default("lbs"),
  stepGoal: integer("step_goal").default(10000),
  sleepGoal: real("sleep_goal").default(8),
  reminderTimes: jsonb("reminder_times").$type<{
    nutrition: string;
    workout: string;
    photo: string;
    weighIn: string;
    habits: string;
  }>().default({
    nutrition: "20:30",
    workout: "18:00",
    photo: "10:00",
    weighIn: "10:15",
    habits: "21:00"
  }),
  smartReminders: boolean("smart_reminders").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily nutrition log
export const dayLogs = pgTable("day_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  date: date("date").notNull(),
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
  notes: text("notes"),
  skipped: boolean("skipped").default(false),
  skippedReason: text("skipped_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workout log
export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  date: date("date").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // Push, Pull, Legs, Plyo-Abs, Rest
  durationMin: integer("duration_min"),
  notes: text("notes"),
  exercises: text("exercises"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly progress photos
export const weeklyPhotos = pgTable("weekly_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  weekNumber: integer("week_number").notNull(),
  mondayDate: date("monday_date").notNull(),
  imageUri: text("image_uri").notNull(),
  isLate: boolean("is_late").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly check-in (weight + measurements)
export const weeklyCheckIns = pgTable("weekly_check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  weekNumber: integer("week_number").notNull(),
  weight: real("weight"),
  waist: real("waist"),
  hips: real("hips"),
  chest: real("chest"),
  bodyFat: real("body_fat"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily habit log
export const habitLogs = pgTable("habit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  date: date("date").notNull(),
  waterDone: boolean("water_done").default(false),
  steps: integer("steps"),
  stepsDone: boolean("steps_done").default(false),
  sleepHours: real("sleep_hours"),
  sleepDone: boolean("sleep_done").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminder log for debugging
export const reminderLogs = pgTable("reminder_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  type: varchar("type", { length: 20 }).notNull(),
  targetDate: date("target_date").notNull(),
  fired: boolean("fired").default(false),
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profile (for authentication and personal info)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  heightValue: real("height_value").notNull(),
  heightUnit: varchar("height_unit", { length: 10 }).notNull().default("ft"),
  weightUnit: varchar("weight_unit", { length: 10 }).notNull().default("lbs"),
  passwordHash: text("password_hash").notNull(),
  requirePasswordOnOpen: boolean("require_password_on_open").default(true),
  autoLockMinutes: integer("auto_lock_minutes").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App settings (for single user)
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayName: text("display_name"),
  theme: varchar("theme", { length: 10 }).default("auto"),
  appLockEnabled: boolean("app_lock_enabled").default(false),
  demoDataEnabled: boolean("demo_data_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const challengesRelations = relations(challenges, ({ many }) => ({
  dayLogs: many(dayLogs),
  workoutLogs: many(workoutLogs),
  weeklyPhotos: many(weeklyPhotos),
  weeklyCheckIns: many(weeklyCheckIns),
  habitLogs: many(habitLogs),
  reminderLogs: many(reminderLogs),
}));

export const dayLogsRelations = relations(dayLogs, ({ one }) => ({
  challenge: one(challenges, {
    fields: [dayLogs.challengeId],
    references: [challenges.id],
  }),
}));

export const workoutLogsRelations = relations(workoutLogs, ({ one }) => ({
  challenge: one(challenges, {
    fields: [workoutLogs.challengeId],
    references: [challenges.id],
  }),
}));

export const weeklyPhotosRelations = relations(weeklyPhotos, ({ one }) => ({
  challenge: one(challenges, {
    fields: [weeklyPhotos.challengeId],
    references: [challenges.id],
  }),
}));

export const weeklyCheckInsRelations = relations(weeklyCheckIns, ({ one }) => ({
  challenge: one(challenges, {
    fields: [weeklyCheckIns.challengeId],
    references: [challenges.id],
  }),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  challenge: one(challenges, {
    fields: [habitLogs.challengeId],
    references: [challenges.id],
  }),
}));

export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  challenge: one(challenges, {
    fields: [reminderLogs.challengeId],
    references: [challenges.id],
  }),
}));

// Insert schemas
export const insertChallengeSchema = createInsertSchema(challenges).omit({ id: true, createdAt: true });
export const insertDayLogSchema = createInsertSchema(dayLogs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWeeklyPhotoSchema = createInsertSchema(weeklyPhotos).omit({ id: true, createdAt: true });
export const insertWeeklyCheckInSchema = createInsertSchema(weeklyCheckIns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderLogSchema = createInsertSchema(reminderLogs).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type DayLog = typeof dayLogs.$inferSelect;
export type InsertDayLog = z.infer<typeof insertDayLogSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WeeklyPhoto = typeof weeklyPhotos.$inferSelect;
export type InsertWeeklyPhoto = z.infer<typeof insertWeeklyPhotoSchema>;
export type WeeklyCheckIn = typeof weeklyCheckIns.$inferSelect;
export type InsertWeeklyCheckIn = z.infer<typeof insertWeeklyCheckInSchema>;
export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type InsertReminderLog = z.infer<typeof insertReminderLogSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

// Workout types enum
export const WORKOUT_TYPES = ["Push", "Pull", "Legs", "Plyo-Abs", "Rest"] as const;
export type WorkoutType = typeof WORKOUT_TYPES[number];
