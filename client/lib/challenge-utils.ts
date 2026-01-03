export type ChallengeStatus = "PRE_CHALLENGE" | "ACTIVE" | "COMPLETE";

export function getNextMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

export function isTodayMonday(): boolean {
  return new Date().getDay() === 1;
}

export function getStartDateForNewChallenge(): string {
  const now = new Date();
  if (isTodayMonday()) {
    return formatDateYYYYMMDD(now);
  }
  return formatDateYYYYMMDD(getNextMonday());
}

export function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getChallengeStatus(startDateStr: string): ChallengeStatus {
  const startDate = new Date(startDateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (today < startDate) {
    return "PRE_CHALLENGE";
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 17 * 7);
  
  if (today >= endDate) {
    return "COMPLETE";
  }
  
  return "ACTIVE";
}

export function getCurrentWeekNumber(startDateStr: string): number {
  const startDate = new Date(startDateStr + "T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 0;
  
  const weekNumber = Math.floor(diffDays / 7) + 1;
  return Math.min(weekNumber, 17);
}

export function getDayOfChallenge(startDateStr: string): number {
  const startDate = new Date(startDateStr + "T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(diffDays + 1, 0);
}
