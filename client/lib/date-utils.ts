export function getToday(): string {
  return formatDate(new Date());
}

export function formatDate(date: Date): string {
  // Use local time instead of UTC to prevent timezone issues
  // This ensures the date doesn't change early (e.g., at 10pm EST when it's already next day in UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function getUpcomingMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  if (dayOfWeek === 1) {
    today.setHours(0, 0, 0, 0);
    return today;
  }
  
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

export function getWeekNumber(startDate: string, currentDate: string): number {
  const start = parseDate(startDate);
  const current = parseDate(currentDate);
  const startMonday = getMondayOfWeek(start);
  const currentMonday = getMondayOfWeek(current);
  
  const diffTime = currentMonday.getTime() - startMonday.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  
  return Math.max(1, Math.min(17, diffWeeks + 1));
}

export function getCurrentWeekNumber(startDate: string): number {
  return getWeekNumber(startDate, getToday());
}

export function isMonday(date: Date = new Date()): boolean {
  return date.getDay() === 1;
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLongDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDayOfWeek(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

export function isBeforeToday(dateStr: string): boolean {
  return dateStr < getToday();
}

export function getMondayDateForWeek(startDate: string, weekNumber: number): string {
  const start = parseDate(startDate);
  const monday = getMondayOfWeek(start);
  monday.setDate(monday.getDate() + (weekNumber - 1) * 7);
  return formatDate(monday);
}
