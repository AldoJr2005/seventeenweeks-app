import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import type { Challenge, DayLog, WorkoutLog, WeeklyPhoto, WeeklyCheckIn, HabitLog, UserProfile } from "@shared/schema";

interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  dayLogs: DayLog[];
  workoutLogs: WorkoutLog[];
  habitLogs: HabitLog[];
  photo: WeeklyPhoto | null;
  checkIn: WeeklyCheckIn | null;
}

interface PDFData {
  challenge: Challenge;
  profile?: UserProfile | null;
  weeks: WeekData[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

function generateStyles(): string {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
        background: #FFFFFF;
        color: #000000;
        line-height: 1.5;
        padding: 40px;
      }
      .page {
        page-break-after: always;
        min-height: 100vh;
      }
      .page:last-child {
        page-break-after: avoid;
      }
      .header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 1px solid #E5E5E5;
      }
      .header h1 {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
        color: #000;
      }
      .header .subtitle {
        font-size: 16px;
        color: #666;
        margin-bottom: 4px;
      }
      .header .date-range {
        font-size: 14px;
        color: #8E8E93;
      }
      .section {
        margin-bottom: 32px;
      }
      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: #8E8E93;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
      }
      .card {
        background: #F9F9F9;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
      }
      .card-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #E5E5E5;
      }
      .card-row:last-child {
        border-bottom: none;
      }
      .card-label {
        font-size: 15px;
        color: #666;
      }
      .card-value {
        font-size: 15px;
        font-weight: 600;
        color: #000;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .stat-card {
        background: #F9F9F9;
        border-radius: 16px;
        padding: 20px;
        text-align: center;
      }
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #007AFF;
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: 13px;
        color: #8E8E93;
      }
      .stat-sub {
        font-size: 11px;
        color: #ABABAB;
        margin-top: 4px;
      }
      .photo-container {
        text-align: center;
        margin: 20px 0;
      }
      .photo-container img {
        max-width: 300px;
        max-height: 400px;
        border-radius: 16px;
        object-fit: cover;
      }
      .photo-placeholder {
        background: #F2F2F2;
        border-radius: 16px;
        padding: 60px 40px;
        text-align: center;
        color: #8E8E93;
        font-size: 14px;
      }
      .daily-table {
        width: 100%;
        border-collapse: collapse;
        background: #F9F9F9;
        border-radius: 16px;
        overflow: hidden;
      }
      .daily-table th {
        background: #E5E5E5;
        font-size: 11px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        padding: 12px 8px;
        text-align: left;
      }
      .daily-table td {
        font-size: 13px;
        padding: 12px 8px;
        border-bottom: 1px solid #E5E5E5;
        vertical-align: top;
      }
      .daily-table tr:last-child td {
        border-bottom: none;
      }
      .check {
        color: #34C759;
        font-weight: 600;
      }
      .dash {
        color: #8E8E93;
      }
      .skipped {
        color: #8E8E93;
        font-style: italic;
      }
      .workout-badge {
        display: inline-block;
        background: #007AFF;
        color: white;
        padding: 2px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
      }
      .workout-rest {
        background: #E5E5E5;
        color: #666;
      }
      .mini-chart {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        height: 60px;
        padding: 10px 0;
      }
      .mini-chart .bar {
        flex: 1;
        background: #007AFF;
        border-radius: 4px 4px 0 0;
        min-height: 4px;
      }
      .cover-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        text-align: center;
      }
      .cover-title {
        font-size: 42px;
        font-weight: 700;
        margin-bottom: 16px;
      }
      .cover-subtitle {
        font-size: 20px;
        color: #666;
        margin-bottom: 40px;
      }
      .cover-dates {
        font-size: 16px;
        color: #8E8E93;
      }
      .summary-card {
        background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
        border-radius: 20px;
        padding: 30px;
        color: white;
        margin-bottom: 24px;
      }
      .summary-card h2 {
        font-size: 24px;
        margin-bottom: 20px;
      }
      .summary-stat {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255,255,255,0.2);
      }
      .summary-stat:last-child {
        border-bottom: none;
      }
      .week-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #007AFF;
      }
      .week-header h2 {
        font-size: 24px;
        font-weight: 700;
      }
      .week-header .dates {
        font-size: 14px;
        color: #8E8E93;
      }
    </style>
  `;
}

function generateWeekOverview(week: WeekData, challenge: Challenge): string {
  const avgCalories = week.dayLogs.length > 0 
    ? Math.round(week.dayLogs.reduce((sum, d) => sum + (d.calories || 0), 0) / week.dayLogs.filter(d => d.calories).length) || 0
    : 0;
  const avgProtein = week.dayLogs.length > 0
    ? Math.round(week.dayLogs.reduce((sum, d) => sum + (d.protein || 0), 0) / week.dayLogs.filter(d => d.protein).length) || 0
    : 0;
  const avgCarbs = week.dayLogs.length > 0
    ? Math.round(week.dayLogs.reduce((sum, d) => sum + (d.carbs || 0), 0) / week.dayLogs.filter(d => d.carbs).length) || 0
    : 0;
  const avgFat = week.dayLogs.length > 0
    ? Math.round(week.dayLogs.reduce((sum, d) => sum + (d.fat || 0), 0) / week.dayLogs.filter(d => d.fat).length) || 0
    : 0;

  const workoutsCompleted = week.workoutLogs.filter(w => w.type !== "Rest").length;
  const workoutsByType: Record<string, number> = {};
  week.workoutLogs.forEach(w => {
    workoutsByType[w.type] = (workoutsByType[w.type] || 0) + 1;
  });

  const waterDays = week.habitLogs.filter(h => h.waterDone).length;
  const avgSteps = week.habitLogs.length > 0
    ? Math.round(week.habitLogs.reduce((sum, h) => sum + (h.steps || 0), 0) / week.habitLogs.filter(h => h.steps).length) || 0
    : 0;
  const avgSleep = week.habitLogs.length > 0
    ? (week.habitLogs.reduce((sum, h) => sum + (h.sleepHours || 0), 0) / week.habitLogs.filter(h => h.sleepHours).length).toFixed(1)
    : "0";

  const currentWeight = week.checkIn?.weight;
  const startWeight = challenge.startWeight;
  const totalChange = currentWeight ? (currentWeight - startWeight).toFixed(1) : "—";

  return `
    <div class="section">
      <div class="section-title">Weekly Overview</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${avgCalories || "—"}</div>
          <div class="stat-label">Avg Calories</div>
          <div class="stat-sub">P: ${avgProtein}g / C: ${avgCarbs}g / F: ${avgFat}g</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${workoutsCompleted}</div>
          <div class="stat-label">Workouts</div>
          <div class="stat-sub">${Object.entries(workoutsByType).map(([k, v]) => `${k}: ${v}`).join(", ") || "None"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${waterDays}/7</div>
          <div class="stat-label">Water Days</div>
          <div class="stat-sub">Avg ${avgSteps.toLocaleString()} steps</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${currentWeight || "—"}</div>
          <div class="stat-label">Week ${week.weekNumber} Weight</div>
          <div class="stat-sub">${totalChange !== "—" ? `${parseFloat(totalChange) >= 0 ? "+" : ""}${totalChange} ${challenge.unit} total` : "Not logged"}</div>
        </div>
      </div>
    </div>
  `;
}

function generateDailyTable(week: WeekData): string {
  const startDate = new Date(week.startDate);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }

  const rows = days.map((dateStr, i) => {
    const dayLog = week.dayLogs.find(d => d.date === dateStr);
    const workoutLog = week.workoutLogs.find(w => w.date === dateStr);
    const habitLog = week.habitLogs.find(h => h.date === dateStr);

    if (dayLog?.skipped) {
      return `
        <tr>
          <td><strong>${DAYS[i]}</strong><br/>${formatDate(dateStr)}</td>
          <td colspan="6" class="skipped">Skipped${dayLog.skippedReason ? `: ${dayLog.skippedReason}` : ""}</td>
        </tr>
      `;
    }

    return `
      <tr>
        <td><strong>${DAYS[i]}</strong><br/>${formatDate(dateStr)}</td>
        <td>${dayLog?.calories || '<span class="dash">—</span>'}</td>
        <td>${dayLog ? `${dayLog.protein || 0}/${dayLog.carbs || 0}/${dayLog.fat || 0}` : '<span class="dash">—</span>'}</td>
        <td>${habitLog?.steps ? habitLog.steps.toLocaleString() : '<span class="dash">—</span>'}</td>
        <td>${habitLog?.waterDone ? '<span class="check">✓</span>' : '<span class="dash">—</span>'}</td>
        <td>${habitLog?.sleepHours || '<span class="dash">—</span>'}</td>
        <td>${workoutLog ? `<span class="workout-badge ${workoutLog.type === "Rest" ? "workout-rest" : ""}">${workoutLog.type}</span>${workoutLog.durationMin ? ` ${workoutLog.durationMin}min` : ""}` : '<span class="dash">—</span>'}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="section">
      <div class="section-title">Daily Details</div>
      <table class="daily-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Cals</th>
            <th>P/C/F</th>
            <th>Steps</th>
            <th>Water</th>
            <th>Sleep</th>
            <th>Workout</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function generatePhotoSection(week: WeekData): string {
  if (week.photo?.imageUri) {
    return `
      <div class="section">
        <div class="section-title">Week ${week.weekNumber} Photo</div>
        <div class="photo-container">
          <img src="${week.photo.imageUri}" alt="Week ${week.weekNumber} progress photo" />
        </div>
      </div>
    `;
  }
  
  return `
    <div class="section">
      <div class="section-title">Week ${week.weekNumber} Photo</div>
      <div class="photo-placeholder">No photo uploaded for this week</div>
    </div>
  `;
}

function generateWeekPage(week: WeekData, challenge: Challenge): string {
  return `
    <div class="page">
      <div class="week-header">
        <h2>Week ${week.weekNumber} of 17</h2>
        <div class="dates">${formatDate(week.startDate)} – ${formatDate(week.endDate)}</div>
      </div>
      ${generateWeekOverview(week, challenge)}
      ${generatePhotoSection(week)}
      ${generateDailyTable(week)}
    </div>
  `;
}

function generateCoverPage(data: PDFData): string {
  const startDate = formatDateFull(data.challenge.startDate);
  const endDate = new Date(data.challenge.startDate);
  endDate.setDate(endDate.getDate() + 17 * 7 - 1);
  
  return `
    <div class="page">
      <div class="cover-page">
        <div class="cover-title">17-Week Challenge</div>
        <div class="cover-subtitle">${data.profile?.name ? `${data.profile.name}'s ` : ""}Full Summary Report</div>
        <div class="cover-dates">${startDate} — ${formatDateFull(endDate.toISOString())}</div>
      </div>
    </div>
  `;
}

function generateFinalSummary(data: PDFData): string {
  const allDayLogs = data.weeks.flatMap(w => w.dayLogs);
  const allWorkoutLogs = data.weeks.flatMap(w => w.workoutLogs);
  const allHabitLogs = data.weeks.flatMap(w => w.habitLogs);
  const allCheckIns = data.weeks.map(w => w.checkIn).filter(Boolean) as WeeklyCheckIn[];

  const totalWorkouts = allWorkoutLogs.filter(w => w.type !== "Rest").length;
  const avgCalories = allDayLogs.length > 0 
    ? Math.round(allDayLogs.reduce((sum, d) => sum + (d.calories || 0), 0) / allDayLogs.filter(d => d.calories).length) || 0
    : 0;
  
  const lastWeight = allCheckIns.length > 0 ? allCheckIns[allCheckIns.length - 1]?.weight : null;
  const totalChange = lastWeight ? (lastWeight - data.challenge.startWeight).toFixed(1) : null;

  const daysLogged = allDayLogs.filter(d => d.calories || d.protein).length;
  const totalDays = data.weeks.length * 7;
  const compliance = totalDays > 0 ? Math.round((daysLogged / totalDays) * 100) : 0;

  return `
    <div class="page">
      <div class="header">
        <h1>Challenge Complete</h1>
        <div class="subtitle">Final Summary</div>
      </div>
      
      <div class="summary-card">
        <h2>Your Results</h2>
        <div class="summary-stat">
          <span>Starting Weight</span>
          <span>${data.challenge.startWeight} ${data.challenge.unit}</span>
        </div>
        <div class="summary-stat">
          <span>Final Weight</span>
          <span>${lastWeight || "—"} ${data.challenge.unit}</span>
        </div>
        <div class="summary-stat">
          <span>Total Change</span>
          <span>${totalChange ? `${parseFloat(totalChange) >= 0 ? "+" : ""}${totalChange} ${data.challenge.unit}` : "—"}</span>
        </div>
        <div class="summary-stat">
          <span>Goal Weight</span>
          <span>${data.challenge.goalWeight || "—"} ${data.challenge.unit}</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalWorkouts}</div>
          <div class="stat-label">Total Workouts</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgCalories}</div>
          <div class="stat-label">Avg Daily Calories</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${compliance}%</div>
          <div class="stat-label">Logging Compliance</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.weeks.length}</div>
          <div class="stat-label">Weeks Tracked</div>
        </div>
      </div>
    </div>
  `;
}

export async function generateWeeklyPDF(
  week: WeekData,
  challenge: Challenge,
  profile?: UserProfile | null
): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Week ${week.weekNumber} Report</title>
      ${generateStyles()}
    </head>
    <body>
      <div class="header">
        <h1>17-Week Challenge</h1>
        <div class="subtitle">Week ${week.weekNumber} of 17${profile?.name ? ` — ${profile.name}` : ""}</div>
        <div class="date-range">${formatDate(week.startDate)} – ${formatDate(week.endDate)}</div>
      </div>
      ${generateWeekOverview(week, challenge)}
      ${generatePhotoSection(week)}
      ${generateDailyTable(week)}
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function generateFullChallengePDF(data: PDFData): Promise<string> {
  const weekPages = data.weeks.map(week => generateWeekPage(week, data.challenge)).join("");
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>17-Week Challenge - Full Report</title>
      ${generateStyles()}
    </head>
    <body>
      ${generateCoverPage(data)}
      ${weekPages}
      ${generateFinalSummary(data)}
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function sharePDF(uri: string, filename: string): Promise<void> {
  if (Platform.OS === "web") {
    const link = document.createElement("a");
    link.href = uri;
    link.download = filename;
    link.click();
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Share Challenge Report",
      UTI: "com.adobe.pdf",
    });
  }
}

export function getWeekDataFromLogs(
  weekNumber: number,
  challenge: Challenge,
  dayLogs: DayLog[],
  workoutLogs: WorkoutLog[],
  habitLogs: HabitLog[],
  weeklyPhotos: WeeklyPhoto[],
  weeklyCheckIns: WeeklyCheckIn[]
): WeekData {
  const startDate = new Date(challenge.startDate);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const weekDayLogs = dayLogs.filter(d => d.date >= startStr && d.date <= endStr);
  const weekWorkoutLogs = workoutLogs.filter(w => w.date >= startStr && w.date <= endStr);
  const weekHabitLogs = habitLogs.filter(h => h.date >= startStr && h.date <= endStr);
  const photo = weeklyPhotos.find(p => p.weekNumber === weekNumber) || null;
  const checkIn = weeklyCheckIns.find(c => c.weekNumber === weekNumber) || null;

  return {
    weekNumber,
    startDate: startStr,
    endDate: endStr,
    dayLogs: weekDayLogs,
    workoutLogs: weekWorkoutLogs,
    habitLogs: weekHabitLogs,
    photo,
    checkIn,
  };
}
