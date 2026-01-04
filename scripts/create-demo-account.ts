import { db } from "../server/db";
import {
  userProfiles,
  challenges,
  foodEntries,
  dayLogs,
  workoutLogs,
  habitLogs,
  weeklyPhotos,
  weeklyCheckIns,
  baselineSnapshots,
  type InsertUserProfile,
  type InsertChallenge,
  type InsertFoodEntry,
  type InsertDayLog,
  type InsertWorkoutLog,
  type InsertHabitLog,
  type InsertWeeklyPhoto,
  type InsertWeeklyCheckIn,
  type InsertBaselineSnapshot,
} from "../shared/schema";
import { sql } from "drizzle-orm";
import * as Crypto from "crypto";

// Helper to hash password (SHA256)
function hashPassword(password: string): string {
  return Crypto.createHash("sha256").update(password).digest("hex");
}

// Generate random weight with slight downward trend
function getWeightForWeek(startWeight: number, week: number): number {
  const lossPerWeek = 1.0; // 1 lb per week
  const randomVariation = (Math.random() - 0.5) * 0.5; // ±0.25 lbs variation
  return Math.round((startWeight - (week * lossPerWeek) + randomVariation) * 10) / 10;
}

// Generate random calories within target range
function getRandomCalories(target: number): number {
  const variation = 150; // ±150 calories
  const min = Math.max(target - variation, 1200);
  const max = target + variation;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate macros based on calories (40% carbs, 30% protein, 30% fat)
function getMacros(calories: number) {
  const proteinGrams = Math.floor((calories * 0.30) / 4);
  const carbsGrams = Math.floor((calories * 0.40) / 4);
  const fatGrams = Math.floor((calories * 0.30) / 9);
  return { protein: proteinGrams, carbs: carbsGrams, fat: fatGrams };
}

// Workout types (matching schema: type is varchar, exercises is text)
const workoutTypes = [
  { type: "Push", duration: 60, exercises: "Bench Press, Shoulder Press, Tricep Dips, Chest Flyes" },
  { type: "Pull", duration: 60, exercises: "Pull-ups, Rows, Bicep Curls, Face Pulls" },
  { type: "Legs", duration: 75, exercises: "Squats, Deadlifts, Lunges, Calf Raises" },
  { type: "Plyo-Abs", duration: 45, exercises: "Box Jumps, Planks, Mountain Climbers, Russian Twists" },
];

// Helper to get Monday of a week
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

async function createDemoAccount() {
  console.log("Creating demo account...");

  // 1. Create user profile
  const passwordHash = hashPassword("1234");
  const demoProfile: InsertUserProfile = {
    username: "demo",
    name: "Demo User",
    email: "demo@example.com",
    heightValue: 70, // 5'10"
    heightUnit: "ft",
    weightUnit: "lbs",
    currentWeight: 180,
    age: 30,
    sex: "male",
    passwordHash,
    requirePasswordOnOpen: true,
    autoLockMinutes: 0,
    onboardingComplete: true,
  };

  const [profile] = await db.insert(userProfiles).values(demoProfile).returning();
  console.log(`Created profile: ${profile.id}`);

  // 2. Create challenge (started 7 weeks ago)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (7 * 7)); // 7 weeks ago
  const startDateStr = startDate.toISOString().split("T")[0];

  const challenge: InsertChallenge = {
    userId: profile.id,
    status: "ACTIVE",
    startDate: startDateStr,
    startWeight: 180,
    goalWeight: 165,
    unit: "lbs",
    stepGoal: 10000,
    sleepGoal: 8,
    activityLevel: "moderate",
    tdeeEstimate: 2200,
    targetCalories: 1700,
    targetWeeklyLoss: 1.0,
    deficitLevel: "moderate",
    workoutsPerWeek: 4,
    preferredSplit: "ppl",
    doesRun: true,
    runningDaysPerWeek: 2,
    fastingType: "16_8",
    lunchTime: "12:00",
    eatingStartTime: "12:00",
    eatingEndTime: "20:00",
    reminderIntensity: "NORMAL",
    smartReminders: true,
    targetProteinGrams: 128,
    targetCarbsGrams: 170,
    targetFatGrams: 57,
    macroPreset: "BALANCED",
  };

  const [challengeRecord] = await db.insert(challenges).values(challenge).returning();
  console.log(`Created challenge: ${challengeRecord.id}`);

  // 3. Create baseline snapshot
  const baseline: InsertBaselineSnapshot = {
    challengeId: challengeRecord.id,
    baselineWeight: 180,
    baselinePhotoUri: "https://picsum.photos/400/600?random=baseline",
    typicalSteps: 8000,
    workoutsPerWeek: 3,
    typicalCalories: 2200,
    typicalSleep: 7.5,
  };
  await db.insert(baselineSnapshots).values(baseline);
  console.log("Created baseline snapshot");

  // 4. Create data for 7 weeks
  for (let week = 0; week <= 7; week++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() + (week * 7));

    // Weekly photo (skip week 0 baseline)
    if (week > 0) {
      const mondayDate = getMonday(weekStartDate);
      const photo: InsertWeeklyPhoto = {
        challengeId: challengeRecord.id,
        weekNumber: week,
        mondayDate: mondayDate.toISOString().split("T")[0],
        imageUri: `https://picsum.photos/400/600?random=week${week}`,
      };
      await db.insert(weeklyPhotos).values(photo);
    }

    // Weekly check-in (skip week 0)
    if (week > 0) {
      const checkIn: InsertWeeklyCheckIn = {
        challengeId: challengeRecord.id,
        weekNumber: week,
        weight: getWeightForWeek(180, week),
        notes: `Week ${week} completed!`,
      };
      await db.insert(weeklyCheckIns).values(checkIn);
    }

    // Daily data for each day of the week
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + day);
      const dateStr = currentDate.toISOString().split("T")[0];

      // Skip future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (currentDate > today) continue;

      const calories = getRandomCalories(1700);
      const macros = getMacros(calories);
      const currentWeight = getWeightForWeek(180, week + (day / 7));

      // Food entries (3-4 per day)
      const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;
      const numMeals = Math.random() > 0.3 ? 4 : 3;
      const selectedMeals = mealTypes.slice(0, numMeals);

      for (const mealType of selectedMeals) {
        const mealCalories = Math.floor(calories / numMeals);
        const mealProtein = Math.floor((mealCalories * 0.30) / 4);
        const mealCarbs = Math.floor((mealCalories * 0.40) / 4);
        const mealFat = Math.floor((mealCalories * 0.30) / 9);
        const foodEntry: InsertFoodEntry = {
          challengeId: challengeRecord.id,
          date: dateStr,
          mealType,
          foodName: `${mealType} meal`,
          caloriesPerServing: mealCalories,
          proteinPerServing: mealProtein,
          carbsPerServing: mealCarbs,
          fatPerServing: mealFat,
          servingsCount: 1,
          source: "manual",
        };
        await db.insert(foodEntries).values(foodEntry);
      }

      // Day log
      const dayLog: InsertDayLog = {
        challengeId: challengeRecord.id,
        date: dateStr,
        calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        notes: day % 3 === 0 ? "Good day!" : null,
      };
      await db.insert(dayLogs).values(dayLog);

      // Workout (4-5 times per week, random days)
      if (Math.random() > 0.4) {
        const workoutType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
        const workoutLog: InsertWorkoutLog = {
          challengeId: challengeRecord.id,
          date: dateStr,
          type: workoutType.type,
          durationMin: workoutType.duration,
          exercises: workoutType.exercises,
          notes: `Completed ${workoutType.type} workout`,
        };
        await db.insert(workoutLogs).values(workoutLog);
      }

      // Habits (most days) - schema uses specific fields, not habitName
      if (Math.random() > 0.15) {
        const habitLog: InsertHabitLog = {
          challengeId: challengeRecord.id,
          date: dateStr,
          waterDone: Math.random() > 0.2,
          steps: Math.floor(Math.random() * 3000) + 8000, // 8000-11000 steps
          stepsDone: Math.random() > 0.2,
          sleepHours: Math.random() * 1.5 + 7, // 7-8.5 hours
          sleepDone: Math.random() > 0.15,
        };
        await db.insert(habitLogs).values(habitLog);
      }
    }

    console.log(`Created data for week ${week}`);
  }

  console.log("\n✅ Demo account created successfully!");
  console.log(`Username: demo`);
  console.log(`PIN: 1234`);
  console.log(`Profile ID: ${profile.id}`);
}

createDemoAccount()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error creating demo account:", error);
    process.exit(1);
  });

