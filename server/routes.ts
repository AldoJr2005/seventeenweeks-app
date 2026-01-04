import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertChallengeSchema, insertDayLogSchema, insertWorkoutLogSchema,
  insertWeeklyPhotoSchema, insertWeeklyCheckInSchema, insertHabitLogSchema,
  insertUserProfileSchema, insertAppSettingsSchema,
  insertBaselineSnapshotSchema, insertWeeklyReflectionSchema,
  insertFoodEntrySchema,
  challenges, foodEntries, dayLogs, workoutLogs, habitLogs, weeklyPhotos, weeklyCheckIns, baselineSnapshots, weeklyReflections
} from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

// In-memory store for PIN reset tokens (expires after 10 minutes)
interface ResetTokenData {
  profileId: string;
  expiresAt: number;
  verified: boolean;
}

const resetTokens = new Map<string, ResetTokenData>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  // Challenge routes
  app.get("/api/challenge", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      if (userId) {
        const challenge = await storage.getChallengeByUserId(userId);
        return res.json(challenge || null);
      }
      const challenge = await storage.getChallenge();
      res.json(challenge || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenge" });
    }
  });

  app.post("/api/challenge", async (req, res) => {
    try {
      const parsed = insertChallengeSchema.parse(req.body);
      const challenge = await storage.createChallenge(parsed);
      res.status(201).json(challenge);
    } catch (error: any) {
      console.error("Challenge creation error:", error);
      res.status(400).json({ error: error.message || "Invalid challenge data" });
    }
  });

  app.patch("/api/challenge/:id", async (req, res) => {
    try {
      const updated = await storage.updateChallenge(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update challenge" });
    }
  });

  // Day logs (nutrition)
  app.get("/api/day-logs", async (req, res) => {
    try {
      const challengeId = req.query.challengeId as string;
      if (!challengeId) {
        return res.status(400).json({ error: "challengeId required" });
      }
      const logs = await storage.getDayLogs(challengeId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch day logs" });
    }
  });

  app.get("/api/day-logs/:date", async (req, res) => {
    try {
      const log = await storage.getDayLog(req.params.date);
      res.json(log || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch day log" });
    }
  });

  app.post("/api/day-logs", async (req, res) => {
    try {
      const parsed = insertDayLogSchema.parse(req.body);
      const log = await storage.createDayLog(parsed);
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid day log data" });
    }
  });

  app.patch("/api/day-logs/:id", async (req, res) => {
    try {
      const updated = await storage.updateDayLog(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Day log not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update day log" });
    }
  });

  // Workout logs
  app.get("/api/workout-logs", async (req, res) => {
    try {
      const challengeId = req.query.challengeId as string;
      if (!challengeId) {
        return res.status(400).json({ error: "challengeId required" });
      }
      const logs = await storage.getWorkoutLogs(challengeId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout logs" });
    }
  });

  app.get("/api/workout-logs/:date", async (req, res) => {
    try {
      const log = await storage.getWorkoutLog(req.params.date);
      res.json(log || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout log" });
    }
  });

  app.post("/api/workout-logs", async (req, res) => {
    try {
      const parsed = insertWorkoutLogSchema.parse(req.body);
      const log = await storage.createWorkoutLog(parsed);
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout log data" });
    }
  });

  app.patch("/api/workout-logs/:id", async (req, res) => {
    try {
      const updated = await storage.updateWorkoutLog(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Workout log not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workout log" });
    }
  });

  // Weekly photos
  app.get("/api/weekly-photos", async (req, res) => {
    try {
      const challengeId = req.query.challengeId as string;
      if (!challengeId) {
        return res.status(400).json({ error: "challengeId required" });
      }
      const photos = await storage.getWeeklyPhotos(challengeId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly photos" });
    }
  });

  app.get("/api/weekly-photos/:weekNumber", async (req, res) => {
    try {
      const photo = await storage.getWeeklyPhoto(parseInt(req.params.weekNumber));
      res.json(photo || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly photo" });
    }
  });

  app.post("/api/weekly-photos", async (req, res) => {
    try {
      const parsed = insertWeeklyPhotoSchema.parse(req.body);
      const photo = await storage.createWeeklyPhoto(parsed);
      res.status(201).json(photo);
    } catch (error) {
      res.status(400).json({ error: "Invalid weekly photo data" });
    }
  });

  app.patch("/api/weekly-photos/:id", async (req, res) => {
    try {
      const updated = await storage.updateWeeklyPhoto(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Weekly photo not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update weekly photo" });
    }
  });

  // Weekly check-ins
  app.get("/api/weekly-check-ins", async (req, res) => {
    try {
      const challengeId = req.query.challengeId as string;
      if (!challengeId) {
        return res.status(400).json({ error: "challengeId required" });
      }
      const checkIns = await storage.getWeeklyCheckIns(challengeId);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly check-ins" });
    }
  });

  app.get("/api/weekly-check-ins/:weekNumber", async (req, res) => {
    try {
      const checkIn = await storage.getWeeklyCheckIn(parseInt(req.params.weekNumber));
      res.json(checkIn || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly check-in" });
    }
  });

  app.post("/api/weekly-check-ins", async (req, res) => {
    try {
      const parsed = insertWeeklyCheckInSchema.parse(req.body);
      const checkIn = await storage.createWeeklyCheckIn(parsed);
      res.status(201).json(checkIn);
    } catch (error) {
      res.status(400).json({ error: "Invalid weekly check-in data" });
    }
  });

  app.patch("/api/weekly-check-ins/:id", async (req, res) => {
    try {
      const updated = await storage.updateWeeklyCheckIn(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Weekly check-in not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update weekly check-in" });
    }
  });

  // Habit logs
  app.get("/api/habit-logs", async (req, res) => {
    try {
      const challengeId = req.query.challengeId as string;
      if (!challengeId) {
        return res.status(400).json({ error: "challengeId required" });
      }
      const logs = await storage.getHabitLogs(challengeId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit logs" });
    }
  });

  app.get("/api/habit-logs/:date", async (req, res) => {
    try {
      const log = await storage.getHabitLog(req.params.date);
      res.json(log || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit log" });
    }
  });

  app.post("/api/habit-logs", async (req, res) => {
    try {
      const parsed = insertHabitLogSchema.parse(req.body);
      const log = await storage.createHabitLog(parsed);
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid habit log data" });
    }
  });

  app.patch("/api/habit-logs/:id", async (req, res) => {
    try {
      const updated = await storage.updateHabitLog(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Habit log not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update habit log" });
    }
  });

  // App settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const parsed = insertAppSettingsSchema.parse(req.body);
      const settings = await storage.createAppSettings(parsed);
      res.status(201).json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  app.patch("/api/settings/:id", async (req, res) => {
    try {
      const updated = await storage.updateAppSettings(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Settings not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // User profile routes
  app.get("/api/profile", async (req, res) => {
    try {
      const profileId = req.query.profileId as string | undefined;
      if (profileId) {
        const profile = await storage.getUserProfileById(profileId);
        return res.json(profile || null);
      }
      const profile = await storage.getUserProfile();
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllUserProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const parsed = insertUserProfileSchema.parse(req.body);
      const profile = await storage.createUserProfile(parsed);
      res.status(201).json(profile);
    } catch (error: any) {
      console.error("Profile creation error:", error);
      res.status(400).json({ error: error.message || "Invalid profile data" });
    }
  });

  app.patch("/api/profile/:id", async (req, res) => {
    try {
      const updated = await storage.updateUserProfile(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.delete("/api/profile/:id", async (req, res) => {
    try {
      await storage.deleteUserProfile(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Admin endpoint to reset account by username (for development/testing)
  app.post("/api/admin/reset-account", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ success: false, error: "Username is required" });
      }

      // Find the profile by username
      const profile = await storage.getUserProfileByUsername(username.toLowerCase());
      
      if (!profile) {
        return res.status(404).json({ success: false, error: `No account found with username: ${username}` });
      }

      // Delete all data associated with this profile's challenges first
      const userChallenges = await storage.getChallengeByUserId(profile.id);
      if (userChallenges) {
        await db.delete(foodEntries).where(eq(foodEntries.challengeId, userChallenges.id));
        await db.delete(dayLogs).where(eq(dayLogs.challengeId, userChallenges.id));
        await db.delete(workoutLogs).where(eq(workoutLogs.challengeId, userChallenges.id));
        await db.delete(habitLogs).where(eq(habitLogs.challengeId, userChallenges.id));
        await db.delete(weeklyPhotos).where(eq(weeklyPhotos.challengeId, userChallenges.id));
        await db.delete(weeklyCheckIns).where(eq(weeklyCheckIns.challengeId, userChallenges.id));
        await db.delete(baselineSnapshots).where(eq(baselineSnapshots.challengeId, userChallenges.id));
        await db.delete(weeklyReflections).where(eq(weeklyReflections.challengeId, userChallenges.id));
        await db.delete(challenges).where(eq(challenges.id, userChallenges.id));
      }

      // Delete the profile
      await storage.deleteUserProfile(profile.id);
      
      res.json({ success: true, message: `Account for username "${username}" has been deleted. User can now go through setup again.` });
    } catch (error: any) {
      console.error("Reset account error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to reset account" });
    }
  });

  app.post("/api/profile/verify-password", async (req, res) => {
    try {
      const { passwordHash, profileId } = req.body;
      let profile;
      if (profileId) {
        profile = await storage.getUserProfileById(profileId);
      } else {
        profile = await storage.getUserProfile();
      }
      if (!profile) {
        return res.status(404).json({ error: "No profile found" });
      }
      const isValid = profile.passwordHash === passwordHash;
      res.json({ valid: isValid });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify password" });
    }
  });

  app.post("/api/profile/login", async (req, res) => {
    try {
      const { username, passwordHash } = req.body;
      if (!username || !passwordHash) {
        return res.status(400).json({ success: false, message: "Username and PIN are required" });
      }
      const profile = await storage.getUserProfileByUsername(username);
      if (!profile) {
        return res.json({ success: false, message: "No account found with that username" });
      }
      const isValid = profile.passwordHash === passwordHash;
      if (!isValid) {
        return res.json({ success: false, message: "Incorrect PIN" });
      }
      res.json({ success: true, profileId: profile.id });
    } catch (error) {
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  app.post("/api/profile/change-password", async (req, res) => {
    try {
      const { oldPasswordHash, newPasswordHash } = req.body;
      const profile = await storage.getUserProfile();
      if (!profile) {
        return res.status(404).json({ error: "No profile found" });
      }
      if (profile.passwordHash !== oldPasswordHash) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      if (!newPasswordHash || newPasswordHash.length < 4) {
        return res.status(400).json({ error: "New password is invalid" });
      }
      await storage.updateUserProfile(profile.id, { passwordHash: newPasswordHash });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Verify email/phone for PIN reset
  app.post("/api/profile/verify-reset-contact", async (req, res) => {
    try {
      const { username, email, phone } = req.body;
      
      if (!username) {
        return res.status(400).json({ success: false, error: "Username is required" });
      }

      if (!email && !phone) {
        return res.status(400).json({ success: false, error: "Email or phone is required" });
      }

      // Find profile by username
      const profile = await storage.getUserProfileByUsername(username.toLowerCase());
      if (!profile) {
        return res.status(404).json({ success: false, error: "No account found with that username" });
      }

      // Verify email matches (case-insensitive)
      if (email) {
        if (!profile.email || profile.email.toLowerCase() !== email.toLowerCase().trim()) {
          return res.status(400).json({ success: false, error: "Email does not match the account" });
        }
      }

      // Verify phone matches (normalize both)
      if (phone) {
        const normalizePhone = (p: string) => p.replace(/\D/g, "");
        if (!profile.phone || normalizePhone(profile.phone) !== normalizePhone(phone)) {
          return res.status(400).json({ success: false, error: "Phone number does not match the account" });
        }
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store token temporarily
      resetTokens.set(resetToken, {
        profileId: profile.id,
        expiresAt,
        verified: true,
      });

      res.json({ success: true, resetToken });
    } catch (error) {
      console.error("Verify reset contact error:", error);
      res.status(500).json({ success: false, error: "Failed to verify contact information" });
    }
  });

  // Reset password with verified token
  app.post("/api/profile/reset-password", async (req, res) => {
    try {
      const { resetToken, newPasswordHash } = req.body;
      
      if (!resetToken || !newPasswordHash) {
        return res.status(400).json({ success: false, error: "Reset token and new PIN are required" });
      }

      if (newPasswordHash.length < 4) {
        return res.status(400).json({ success: false, error: "New PIN must be at least 4 characters" });
      }

      // Verify token
      const stored = resetTokens.get(resetToken);
      if (!stored || !stored.verified) {
        return res.status(400).json({ success: false, error: "Invalid or expired reset token" });
      }

      if (stored.expiresAt < Date.now()) {
        resetTokens.delete(resetToken);
        return res.status(400).json({ success: false, error: "Reset token has expired. Please start over." });
      }

      // Reset password
      await storage.updateUserProfile(stored.profileId, { passwordHash: newPasswordHash });
      
      // Clean up reset tokens for this profile
      for (const [key, data] of resetTokens.entries()) {
        if (data.profileId === stored.profileId) {
          resetTokens.delete(key);
        }
      }

      res.json({ success: true, profileId: stored.profileId });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ success: false, error: "Failed to reset password" });
    }
  });

  // Baseline snapshot routes
  app.get("/api/baseline/:challengeId", async (req, res) => {
    try {
      const snapshot = await storage.getBaselineSnapshot(req.params.challengeId);
      res.json(snapshot || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch baseline snapshot" });
    }
  });

  app.post("/api/baseline", async (req, res) => {
    try {
      const parsed = insertBaselineSnapshotSchema.parse(req.body);
      const snapshot = await storage.createBaselineSnapshot(parsed);
      res.status(201).json(snapshot);
    } catch (error: any) {
      console.error("Baseline snapshot creation error:", error);
      res.status(400).json({ error: error.message || "Invalid baseline snapshot data" });
    }
  });

  app.patch("/api/baseline/:id", async (req, res) => {
    try {
      const updated = await storage.updateBaselineSnapshot(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Baseline snapshot not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update baseline snapshot" });
    }
  });

  // Weekly reflection routes
  app.get("/api/reflections", async (req, res) => {
    try {
      const challengeId = req.query.challengeId as string;
      if (!challengeId) {
        return res.status(400).json({ error: "challengeId required" });
      }
      const reflections = await storage.getWeeklyReflections(challengeId);
      res.json(reflections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reflections" });
    }
  });

  app.get("/api/reflections/:challengeId/:weekNumber", async (req, res) => {
    try {
      const reflection = await storage.getWeeklyReflection(
        req.params.challengeId,
        parseInt(req.params.weekNumber)
      );
      res.json(reflection || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reflection" });
    }
  });

  app.post("/api/reflections", async (req, res) => {
    try {
      const parsed = insertWeeklyReflectionSchema.parse(req.body);
      const reflection = await storage.createWeeklyReflection(parsed);
      res.status(201).json(reflection);
    } catch (error: any) {
      console.error("Reflection creation error:", error);
      res.status(400).json({ error: error.message || "Invalid reflection data" });
    }
  });

  app.patch("/api/reflections/:id", async (req, res) => {
    try {
      const updated = await storage.updateWeeklyReflection(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Reflection not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reflection" });
    }
  });

  // Food entries routes
  app.get("/api/food-entries", async (req, res) => {
    try {
      const challengeId = req.query.challengeId as string;
      const date = req.query.date as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!challengeId) {
        return res.status(400).json({ error: "challengeId required" });
      }

      if (startDate && endDate) {
        const entries = await storage.getFoodEntriesByDateRange(challengeId, startDate, endDate);
        return res.json(entries);
      }

      if (!date) {
        return res.status(400).json({ error: "date or startDate/endDate required" });
      }

      const entries = await storage.getFoodEntries(challengeId, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch food entries" });
    }
  });

  app.post("/api/food-entries", async (req, res) => {
    try {
      const parsed = insertFoodEntrySchema.parse(req.body);
      const entry = await storage.createFoodEntry(parsed);
      res.status(201).json(entry);
    } catch (error: any) {
      console.error("Food entry creation error:", error);
      res.status(400).json({ error: error.message || "Invalid food entry data" });
    }
  });

  app.patch("/api/food-entries/:id", async (req, res) => {
    try {
      const updated = await storage.updateFoodEntry(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Food entry not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update food entry" });
    }
  });

  app.delete("/api/food-entries/:id", async (req, res) => {
    try {
      await storage.deleteFoodEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete food entry" });
    }
  });

  // TEMPORARY: For testing - clear all daily data when advancing weeks
  app.post("/api/challenge/:id/clear-daily-data", async (req, res) => {
    try {
      await storage.clearAllDailyData(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear daily data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
