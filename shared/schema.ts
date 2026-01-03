import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Challenge status
export const CHALLENGE_STATUS = ["PRE_CHALLENGE", "ACTIVE", "COMPLETED"] as const;
export type ChallengeStatus = typeof CHALLENGE_STATUS[number];

// Challenge table - stores the 17-week challenge configuration
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: varchar("status", { length: 20 }).notNull().default("PRE_CHALLENGE"),
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
  activityLevel: varchar("activity_level", { length: 20 }),
  tdeeEstimate: integer("tdee_estimate"),
  targetCalories: integer("target_calories"),
  targetWeeklyLoss: real("target_weekly_loss"),
  deficitLevel: varchar("deficit_level", { length: 20 }),
  workoutsPerWeek: integer("workouts_per_week").default(4),
  trainingStyle: varchar("training_style", { length: 30 }),
  preferredSplit: varchar("preferred_split", { length: 30 }),
  doesRun: boolean("does_run").default(false),
  runningDaysPerWeek: integer("running_days_per_week").default(0),
  fastingType: varchar("fasting_type", { length: 10 }),
  lunchTime: varchar("lunch_time", { length: 10 }),
  eatingStartTime: varchar("eating_start_time", { length: 10 }),
  eatingEndTime: varchar("eating_end_time", { length: 10 }),
  reminderIntensity: varchar("reminder_intensity", { length: 10 }).default("NORMAL"),
  reflectionReminderDay: varchar("reflection_reminder_day", { length: 10 }).default("Sunday"),
  reflectionReminderTime: varchar("reflection_reminder_time", { length: 10 }).default("20:30"),
  targetProteinGrams: integer("target_protein_grams"),
  targetCarbsGrams: integer("target_carbs_grams"),
  targetFatGrams: integer("target_fat_grams"),
  macroPreset: varchar("macro_preset", { length: 20 }).default("BALANCED"),
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
  username: varchar("username", { length: 50 }),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  heightValue: real("height_value").notNull(),
  heightUnit: varchar("height_unit", { length: 10 }).notNull().default("ft"),
  weightUnit: varchar("weight_unit", { length: 10 }).notNull().default("lbs"),
  currentWeight: real("current_weight"),
  age: integer("age"),
  sex: varchar("sex", { length: 10 }),
  passwordHash: text("password_hash").notNull(),
  requirePasswordOnOpen: boolean("require_password_on_open").default(true),
  autoLockMinutes: integer("auto_lock_minutes").default(5),
  onboardingComplete: boolean("onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Baseline snapshot (Week 0)
export const baselineSnapshots = pgTable("baseline_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  baselineWeight: real("baseline_weight").notNull(),
  baselinePhotoUri: text("baseline_photo_uri"),
  typicalSteps: integer("typical_steps"),
  workoutsPerWeek: integer("workouts_per_week"),
  typicalCalories: integer("typical_calories"),
  typicalSleep: real("typical_sleep"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly reflection
export const weeklyReflections = pgTable("weekly_reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  weekNumber: integer("week_number").notNull(),
  wentWell: text("went_well"),
  wasHard: text("was_hard"),
  improveNextWeek: text("improve_next_week"),
  learned: text("learned"),
  nextWeekFocus: text("next_week_focus"),
  moodRating: integer("mood_rating"),
  energyRating: integer("energy_rating"),
  overallRating: integer("overall_rating"),
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

// Food entries for meal-based logging (like MyFitnessPal)
export const foodEntries = pgTable("food_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  date: date("date").notNull(),
  time: varchar("time", { length: 10 }),
  mealType: varchar("meal_type", { length: 20 }).notNull(), // Breakfast, Lunch, Dinner, Snacks
  foodName: text("food_name").notNull(),
  brand: text("brand"),
  barcode: varchar("barcode", { length: 50 }),
  caloriesPerServing: integer("calories_per_serving").notNull(),
  proteinPerServing: real("protein_per_serving").default(0),
  carbsPerServing: real("carbs_per_serving").default(0),
  fatPerServing: real("fat_per_serving").default(0),
  fiberPerServing: real("fiber_per_serving").default(0),
  sugarPerServing: real("sugar_per_serving").default(0),
  sodiumPerServing: real("sodium_per_serving").default(0),
  cholesterolPerServing: real("cholesterol_per_serving").default(0),
  servingLabel: varchar("serving_label", { length: 100 }),
  servingGrams: real("serving_grams"),
  servingsCount: real("servings_count").notNull().default(1),
  source: varchar("source", { length: 20 }).default("manual"), // manual, barcode, custom
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const challengesRelations = relations(challenges, ({ many, one }) => ({
  dayLogs: many(dayLogs),
  workoutLogs: many(workoutLogs),
  weeklyPhotos: many(weeklyPhotos),
  weeklyCheckIns: many(weeklyCheckIns),
  habitLogs: many(habitLogs),
  reminderLogs: many(reminderLogs),
  baselineSnapshot: one(baselineSnapshots),
  weeklyReflections: many(weeklyReflections),
  foodEntries: many(foodEntries),
}));

export const foodEntriesRelations = relations(foodEntries, ({ one }) => ({
  challenge: one(challenges, {
    fields: [foodEntries.challengeId],
    references: [challenges.id],
  }),
}));

export const baselineSnapshotsRelations = relations(baselineSnapshots, ({ one }) => ({
  challenge: one(challenges, {
    fields: [baselineSnapshots.challengeId],
    references: [challenges.id],
  }),
}));

export const weeklyReflectionsRelations = relations(weeklyReflections, ({ one }) => ({
  challenge: one(challenges, {
    fields: [weeklyReflections.challengeId],
    references: [challenges.id],
  }),
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
export const insertBaselineSnapshotSchema = createInsertSchema(baselineSnapshots).omit({ id: true, createdAt: true });
export const insertWeeklyReflectionSchema = createInsertSchema(weeklyReflections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFoodEntrySchema = createInsertSchema(foodEntries).omit({ id: true, createdAt: true });

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
export type BaselineSnapshot = typeof baselineSnapshots.$inferSelect;
export type InsertBaselineSnapshot = z.infer<typeof insertBaselineSnapshotSchema>;
export type WeeklyReflection = typeof weeklyReflections.$inferSelect;
export type InsertWeeklyReflection = z.infer<typeof insertWeeklyReflectionSchema>;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;

// Workout types enum
export const WORKOUT_TYPES = ["Push", "Pull", "Legs", "Plyo-Abs", "Rest"] as const;
export type WorkoutType = typeof WORKOUT_TYPES[number];

// Meal types enum
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;
export type MealType = typeof MEAL_TYPES[number];
