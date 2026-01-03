export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: string): number {
  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

export function getActivityMultiplier(activityLevel: string): number {
  switch (activityLevel) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "extreme":
      return 1.9;
    default:
      return 1.55;
  }
}

export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: string,
  activityLevel: string
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const multiplier = getActivityMultiplier(activityLevel);
  return Math.round(bmr * multiplier);
}

export function calculateCalorieTarget(tdee: number, weeklyLossLbs: number): number {
  const dailyDeficit = (weeklyLossLbs * 3500) / 7;
  const target = Math.round(tdee - dailyDeficit);
  return Math.max(1200, target);
}

export function calculateWeeksToGoal(
  currentWeight: number,
  goalWeight: number,
  weeklyLoss: number
): number {
  const totalToLose = currentWeight - goalWeight;
  if (totalToLose <= 0 || weeklyLoss <= 0) return 0;
  return Math.ceil(totalToLose / weeklyLoss);
}
