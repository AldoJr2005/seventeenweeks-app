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

function formatNumber(num: number | null | undefined, decimals: number = 0): string {
  if (num === null || num === undefined || isNaN(num)) return "—";
  return decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString();
}

function hasWeekData(week: WeekData): boolean {
  return week.dayLogs.length > 0 || 
         week.workoutLogs.length > 0 || 
         week.habitLogs.length > 0 || 
         week.checkIn !== null ||
         week.photo !== null;
}

async function convertImageToBase64(uri: string): Promise<string | null> {
  try {
    if (!uri) return null;
    if (uri.startsWith("data:")) return uri;
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const extension = uri.toLowerCase().includes(".png") ? "png" : "jpeg";
    return `data:image/${extension};base64,${base64}`;
  } catch (error) {
    console.log("Failed to convert image to base64:", error);
    return null;
  }
}

function generateStyles(): string {
  return `
    <style>
      @page {
        margin: 0.5in;
        size: letter;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
        background: #FFFFFF;
        color: #1D1D1F;
        line-height: 1.4;
        font-size: 11px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Page structure */
      .page {
        page-break-after: always;
        padding: 20px 0;
        min-height: 100%;
      }
      .page:last-child {
        page-break-after: avoid;
      }
      .avoid-break {
        page-break-inside: avoid;
      }

      /* Cover page */
      .cover-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 85vh;
        text-align: center;
      }
      .cover-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
        border-radius: 20px;
        margin-bottom: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cover-icon svg {
        width: 40px;
        height: 40px;
        fill: white;
      }
      .cover-title {
        font-size: 36px;
        font-weight: 700;
        letter-spacing: -0.5px;
        margin-bottom: 8px;
        color: #1D1D1F;
      }
      .cover-subtitle {
        font-size: 18px;
        color: #86868B;
        margin-bottom: 32px;
        font-weight: 400;
      }
      .cover-dates {
        font-size: 14px;
        color: #86868B;
      }
      .cover-stats {
        display: flex;
        gap: 40px;
        margin-top: 48px;
        padding-top: 32px;
        border-top: 1px solid #E5E5EA;
      }
      .cover-stat {
        text-align: center;
      }
      .cover-stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #007AFF;
      }
      .cover-stat-label {
        font-size: 12px;
        color: #86868B;
        margin-top: 4px;
      }

      /* Headers */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        margin-bottom: 20px;
        border-bottom: 2px solid #007AFF;
      }
      .page-header h2 {
        font-size: 22px;
        font-weight: 700;
        color: #1D1D1F;
        letter-spacing: -0.3px;
      }
      .page-header .dates {
        font-size: 13px;
        color: #86868B;
      }
      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #86868B;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 20px 0 12px 0;
      }

      /* Cards */
      .card {
        background: #F5F5F7;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
      }
      .card-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #E5E5EA;
      }
      .card-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .card-row:first-child {
        padding-top: 0;
      }
      .card-label {
        font-size: 13px;
        color: #86868B;
      }
      .card-value {
        font-size: 13px;
        font-weight: 600;
        color: #1D1D1F;
      }

      /* Stats grid */
      .stats-grid {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .stat-card {
        flex: 1;
        min-width: 140px;
        background: #F5F5F7;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #007AFF;
        margin-bottom: 4px;
        line-height: 1.1;
      }
      .stat-value.success { color: #34C759; }
      .stat-value.warning { color: #FF9500; }
      .stat-label {
        font-size: 11px;
        color: #86868B;
        font-weight: 500;
      }
      .stat-sub {
        font-size: 10px;
        color: #AEAEB2;
        margin-top: 4px;
      }

      /* Photo section */
      .photo-section {
        text-align: center;
        padding: 20px;
        background: #F5F5F7;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .photo-container img {
        max-width: 280px;
        max-height: 350px;
        border-radius: 12px;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .photo-placeholder {
        padding: 40px 20px;
        color: #86868B;
        font-size: 13px;
      }
      .photo-placeholder-icon {
        font-size: 32px;
        margin-bottom: 8px;
        opacity: 0.5;
      }

      /* Tables */
      .daily-table {
        width: 100%;
        border-collapse: collapse;
        background: #F5F5F7;
        border-radius: 12px;
        overflow: hidden;
        font-size: 10px;
      }
      .daily-table th {
        background: #E5E5EA;
        font-size: 9px;
        font-weight: 600;
        color: #86868B;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: 10px 6px;
        text-align: left;
        white-space: nowrap;
      }
      .daily-table td {
        padding: 10px 6px;
        border-bottom: 1px solid #E5E5EA;
        vertical-align: middle;
        word-wrap: break-word;
        max-width: 100px;
      }
      .daily-table tr:last-child td {
        border-bottom: none;
      }
      .daily-table .day-col { width: 70px; }
      .daily-table .cal-col { width: 50px; text-align: right; }
      .daily-table .macro-col { width: 75px; text-align: center; }
      .daily-table .steps-col { width: 55px; text-align: right; }
      .daily-table .water-col { width: 40px; text-align: center; }
      .daily-table .sleep-col { width: 40px; text-align: right; }
      .daily-table .workout-col { width: auto; }

      .check { color: #34C759; font-weight: 600; }
      .dash { color: #AEAEB2; }
      .skipped-row td { color: #86868B; font-style: italic; }
      
      .workout-badge {
        display: inline-block;
        background: #007AFF;
        color: white;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 9px;
        font-weight: 600;
        white-space: nowrap;
      }
      .workout-badge.rest {
        background: #E5E5EA;
        color: #86868B;
      }

      /* Empty week */
      .empty-week {
        background: #F5F5F7;
        border-radius: 12px;
        padding: 40px 20px;
        text-align: center;
        margin-bottom: 12px;
      }
      .empty-week-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.4;
      }
      .empty-week-text {
        color: #86868B;
        font-size: 14px;
      }

      /* Summary cards */
      .summary-hero {
        background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
        border-radius: 16px;
        padding: 24px;
        color: white;
        margin-bottom: 20px;
      }
      .summary-hero h2 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 20px;
      }
      .summary-stat-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        font-size: 14px;
      }
      .summary-stat-row:last-child {
        border-bottom: none;
      }
      .summary-stat-row span:last-child {
        font-weight: 600;
      }

      /* Footer */
      .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 9px;
        color: #AEAEB2;
        padding: 10px;
      }
    </style>
  `;
}

function generateWeekOverview(week: WeekData, challenge: Challenge): string {
  const logsWithCalories = week.dayLogs.filter(d => d.calories && d.calories > 0);
  const avgCalories = logsWithCalories.length > 0 
    ? Math.round(logsWithCalories.reduce((sum, d) => sum + (d.calories || 0), 0) / logsWithCalories.length)
    : null;
  
  const logsWithProtein = week.dayLogs.filter(d => d.protein);
  const avgProtein = logsWithProtein.length > 0
    ? Math.round(logsWithProtein.reduce((sum, d) => sum + (d.protein || 0), 0) / logsWithProtein.length)
    : 0;
  const logsWithCarbs = week.dayLogs.filter(d => d.carbs);
  const avgCarbs = logsWithCarbs.length > 0
    ? Math.round(logsWithCarbs.reduce((sum, d) => sum + (d.carbs || 0), 0) / logsWithCarbs.length)
    : 0;
  const logsWithFat = week.dayLogs.filter(d => d.fat);
  const avgFat = logsWithFat.length > 0
    ? Math.round(logsWithFat.reduce((sum, d) => sum + (d.fat || 0), 0) / logsWithFat.length)
    : 0;

  const workoutsCompleted = week.workoutLogs.filter(w => w.type !== "Rest").length;
  const restDays = week.workoutLogs.filter(w => w.type === "Rest").length;
  const workoutsByType: Record<string, number> = {};
  week.workoutLogs.filter(w => w.type !== "Rest").forEach(w => {
    workoutsByType[w.type] = (workoutsByType[w.type] || 0) + 1;
  });
  const workoutBreakdown = Object.entries(workoutsByType)
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");

  const waterDays = week.habitLogs.filter(h => h.waterDone).length;
  const logsWithSteps = week.habitLogs.filter(h => h.steps && h.steps > 0);
  const avgSteps = logsWithSteps.length > 0
    ? Math.round(logsWithSteps.reduce((sum, h) => sum + (h.steps || 0), 0) / logsWithSteps.length)
    : null;
  const logsWithSleep = week.habitLogs.filter(h => h.sleepHours && h.sleepHours > 0);
  const avgSleep = logsWithSleep.length > 0
    ? (logsWithSleep.reduce((sum, h) => sum + (h.sleepHours || 0), 0) / logsWithSleep.length)
    : null;

  const currentWeight = week.checkIn?.weight;
  const startWeight = challenge.startWeight;
  const totalChange = currentWeight ? currentWeight - startWeight : null;

  const macroText = avgProtein || avgCarbs || avgFat 
    ? `P${avgProtein} / C${avgCarbs} / F${avgFat}` 
    : "No data";

  return `
    <div class="avoid-break">
      <div class="section-title">Weekly Overview</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${avgCalories !== null ? avgCalories.toLocaleString() : "—"}</div>
          <div class="stat-label">Avg Calories</div>
          <div class="stat-sub">${macroText}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${workoutsCompleted}</div>
          <div class="stat-label">Workouts</div>
          <div class="stat-sub">${workoutBreakdown || (restDays > 0 ? `${restDays} rest` : "None logged")}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${waterDays}/7</div>
          <div class="stat-label">Water Days</div>
          <div class="stat-sub">${avgSteps !== null ? avgSteps.toLocaleString() + " avg steps" : "No step data"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value ${totalChange !== null && totalChange < 0 ? "success" : ""}">${currentWeight !== null && currentWeight !== undefined ? currentWeight : "—"}</div>
          <div class="stat-label">Week ${week.weekNumber} Weight</div>
          <div class="stat-sub">${totalChange !== null ? `${totalChange >= 0 ? "+" : ""}${totalChange.toFixed(1)} ${challenge.unit} total` : "Not logged"}</div>
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
        <tr class="skipped-row avoid-break">
          <td class="day-col"><strong>${DAYS[i]}</strong> ${formatDate(dateStr)}</td>
          <td colspan="6">Skipped${dayLog.skippedReason ? ` — ${dayLog.skippedReason}` : ""}</td>
        </tr>
      `;
    }

    const sleepFormatted = habitLog?.sleepHours 
      ? Number(habitLog.sleepHours).toFixed(1) 
      : '<span class="dash">—</span>';
    
    const macros = dayLog && (dayLog.protein || dayLog.carbs || dayLog.fat)
      ? `${dayLog.protein || 0}/${dayLog.carbs || 0}/${dayLog.fat || 0}`
      : '<span class="dash">—</span>';

    let workoutCell = '<span class="dash">—</span>';
    if (workoutLog) {
      const isRest = workoutLog.type === "Rest";
      const duration = workoutLog.durationMin ? ` ${workoutLog.durationMin}m` : "";
      workoutCell = `<span class="workout-badge${isRest ? " rest" : ""}">${workoutLog.type}</span>${duration}`;
    }

    return `
      <tr class="avoid-break">
        <td class="day-col"><strong>${DAYS[i]}</strong> ${formatDate(dateStr)}</td>
        <td class="cal-col">${dayLog?.calories || '<span class="dash">—</span>'}</td>
        <td class="macro-col">${macros}</td>
        <td class="steps-col">${habitLog?.steps ? habitLog.steps.toLocaleString() : '<span class="dash">—</span>'}</td>
        <td class="water-col">${habitLog?.waterDone ? '<span class="check">✓</span>' : '<span class="dash">—</span>'}</td>
        <td class="sleep-col">${sleepFormatted}</td>
        <td class="workout-col">${workoutCell}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="avoid-break">
      <div class="section-title">Daily Details</div>
      <table class="daily-table">
        <thead>
          <tr>
            <th class="day-col">Day</th>
            <th class="cal-col">Cal</th>
            <th class="macro-col">P/C/F</th>
            <th class="steps-col">Steps</th>
            <th class="water-col">H₂O</th>
            <th class="sleep-col">Sleep</th>
            <th class="workout-col">Workout</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function generatePhotoSection(week: WeekData, base64Image: string | null): string {
  if (base64Image) {
    return `
      <div class="avoid-break">
        <div class="section-title">Week ${week.weekNumber} Photo</div>
        <div class="photo-section">
          <div class="photo-container">
            <img src="${base64Image}" alt="Week ${week.weekNumber} progress photo" />
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="avoid-break">
      <div class="section-title">Week ${week.weekNumber} Photo</div>
      <div class="photo-section">
        <div class="photo-placeholder">
          <div class="photo-placeholder-icon">📷</div>
          No photo uploaded for this week
        </div>
      </div>
    </div>
  `;
}

function generateEmptyWeekSection(week: WeekData): string {
  return `
    <div class="page">
      <div class="page-header">
        <h2>Week ${week.weekNumber} of 17</h2>
        <div class="dates">${formatDate(week.startDate)} – ${formatDate(week.endDate)}</div>
      </div>
      <div class="empty-week">
        <div class="empty-week-icon">📋</div>
        <div class="empty-week-text">No data logged for this week</div>
      </div>
    </div>
  `;
}

async function generateWeekPage(week: WeekData, challenge: Challenge): Promise<string> {
  if (!hasWeekData(week)) {
    return generateEmptyWeekSection(week);
  }

  const base64Image = week.photo?.imageUri 
    ? await convertImageToBase64(week.photo.imageUri) 
    : null;

  return `
    <div class="page">
      <div class="page-header">
        <h2>Week ${week.weekNumber} of 17</h2>
        <div class="dates">${formatDate(week.startDate)} – ${formatDate(week.endDate)}</div>
      </div>
      ${generateWeekOverview(week, challenge)}
      ${generatePhotoSection(week, base64Image)}
      ${generateDailyTable(week)}
    </div>
  `;
}

function generateCoverPage(data: PDFData): string {
  const startDate = formatDateFull(data.challenge.startDate);
  const endDate = new Date(data.challenge.startDate);
  endDate.setDate(endDate.getDate() + 17 * 7 - 1);
  
  const allCheckIns = data.weeks.map(w => w.checkIn).filter(Boolean) as WeeklyCheckIn[];
  const lastWeight = allCheckIns.length > 0 ? allCheckIns[allCheckIns.length - 1]?.weight : null;
  const totalChange = lastWeight ? lastWeight - data.challenge.startWeight : null;
  const totalWorkouts = data.weeks.flatMap(w => w.workoutLogs).filter(w => w.type !== "Rest").length;
  const weeksTracked = data.weeks.filter(w => hasWeekData(w)).length;

  return `
    <div class="page">
      <div class="cover-page">
        <div class="cover-icon">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="cover-title">17-Week Challenge</div>
        <div class="cover-subtitle">${data.profile?.name ? `${data.profile.name}'s ` : ""}Progress Report</div>
        <div class="cover-dates">${startDate}<br/>to ${formatDateFull(endDate.toISOString())}</div>
        <div class="cover-stats">
          <div class="cover-stat">
            <div class="cover-stat-value">${weeksTracked}</div>
            <div class="cover-stat-label">Weeks Tracked</div>
          </div>
          <div class="cover-stat">
            <div class="cover-stat-value">${totalWorkouts}</div>
            <div class="cover-stat-label">Workouts</div>
          </div>
          <div class="cover-stat">
            <div class="cover-stat-value">${totalChange !== null ? `${totalChange >= 0 ? "+" : ""}${totalChange.toFixed(1)}` : "—"}</div>
            <div class="cover-stat-label">${data.challenge.unit} Change</div>
          </div>
        </div>
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
  const logsWithCalories = allDayLogs.filter(d => d.calories && d.calories > 0);
  const avgCalories = logsWithCalories.length > 0 
    ? Math.round(logsWithCalories.reduce((sum, d) => sum + (d.calories || 0), 0) / logsWithCalories.length)
    : 0;
  
  const lastWeight = allCheckIns.length > 0 ? allCheckIns[allCheckIns.length - 1]?.weight : null;
  const totalChange = lastWeight ? lastWeight - data.challenge.startWeight : null;

  const daysLogged = allDayLogs.filter(d => d.calories || d.protein).length;
  const totalDays = data.weeks.length * 7;
  const compliance = totalDays > 0 ? Math.round((daysLogged / totalDays) * 100) : 0;

  const waterDays = allHabitLogs.filter(h => h.waterDone).length;
  const photosCount = data.weeks.filter(w => w.photo?.imageUri).length;

  return `
    <div class="page">
      <div class="page-header">
        <h2>Final Summary</h2>
        <div class="dates">Challenge Complete</div>
      </div>
      
      <div class="summary-hero">
        <h2>Your Results</h2>
        <div class="summary-stat-row">
          <span>Starting Weight</span>
          <span>${data.challenge.startWeight} ${data.challenge.unit}</span>
        </div>
        <div class="summary-stat-row">
          <span>Final Weight</span>
          <span>${lastWeight || "—"} ${data.challenge.unit}</span>
        </div>
        <div class="summary-stat-row">
          <span>Total Change</span>
          <span>${totalChange !== null ? `${totalChange >= 0 ? "+" : ""}${totalChange.toFixed(1)} ${data.challenge.unit}` : "—"}</span>
        </div>
        <div class="summary-stat-row">
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
          <div class="stat-value">${avgCalories.toLocaleString()}</div>
          <div class="stat-label">Avg Daily Calories</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${compliance}%</div>
          <div class="stat-label">Logging Compliance</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${waterDays}</div>
          <div class="stat-label">Water Days</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${photosCount}</div>
          <div class="stat-label">Weekly Photos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.weeks.filter(w => hasWeekData(w)).length}</div>
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
  const base64Image = week.photo?.imageUri 
    ? await convertImageToBase64(week.photo.imageUri) 
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Week ${week.weekNumber} Report</title>
      ${generateStyles()}
    </head>
    <body>
      <div class="page-header">
        <h2>Week ${week.weekNumber} of 17</h2>
        <div class="dates">${formatDate(week.startDate)} – ${formatDate(week.endDate)}${profile?.name ? ` • ${profile.name}` : ""}</div>
      </div>
      ${hasWeekData(week) ? `
        ${generateWeekOverview(week, challenge)}
        ${generatePhotoSection(week, base64Image)}
        ${generateDailyTable(week)}
      ` : `
        <div class="empty-week">
          <div class="empty-week-icon">📋</div>
          <div class="empty-week-text">No data logged for this week</div>
        </div>
      `}
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function generateFullChallengePDF(data: PDFData): Promise<string> {
  const weekPagesPromises = data.weeks.map(week => generateWeekPage(week, data.challenge));
  const weekPages = await Promise.all(weekPagesPromises);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>17-Week Challenge - Full Report</title>
      ${generateStyles()}
    </head>
    <body>
      ${generateCoverPage(data)}
      ${weekPages.join("")}
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
