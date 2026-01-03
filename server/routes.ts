import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import {
  insertChallengeSchema, insertDayLogSchema, insertWorkoutLogSchema,
  insertWeeklyPhotoSchema, insertWeeklyCheckInSchema, insertHabitLogSchema,
  insertAppSettingsSchema
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

  const httpServer = createServer(app);
  return httpServer;
}
