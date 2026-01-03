import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import {
  insertChallengeSchema, insertDayLogSchema, insertWorkoutLogSchema,
  insertWeeklyPhotoSchema, insertWeeklyCheckInSchema, insertHabitLogSchema,
  insertUserProfileSchema, insertAppSettingsSchema,
  insertBaselineSnapshotSchema, insertWeeklyReflectionSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Challenge routes
  app.get("/api/challenge", async (req, res) => {
    try {
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
      const profile = await storage.getUserProfile();
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
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

  app.post("/api/profile/verify-password", async (req, res) => {
    try {
      const { passwordHash } = req.body;
      const profile = await storage.getUserProfile();
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
      res.json({ success: true });
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

  const httpServer = createServer(app);
  return httpServer;
}
