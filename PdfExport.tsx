import { storage } from "./storage";

interface Habit {
  id: number;
  name: string;
  color: string;
  currentStreak?: number;
  longestStreak?: number;
}

export function exportMonthlyPDF(habits: Habit[], currentDate: Date) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const daysSoFar = isCurrentMonth ? today.getDate() : daysInMonth;

  const completions = storage.getCompletions();

  // Build per-habit stats
  const habitStats = habits.map((habit) => {
    const days: boolean[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(completions.some((c) => c.habitId === habit.id && c.completedDate === dateStr));
    }
    const completedCount = days.slice(0, daysSoFar).filter(Boolean).length;
    const rate = daysSoFar > 0 ? Math.round((completedCount / daysSoFar) * 100) : 0;
    return { habit, days, completedCount, rate };
  });

  // Day-of-week header
  const startDay = new Date(year, month, 1).getDay(); // 0=Sun
  const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const gridRows = habitStats.map(({ habit, days, completedCount, rate }) => {
    const cells = Array.from({ length: daysInMonth }, (_, i) => {
      const isFuture = i + 1 > daysSoFar;
      const done = days[i];
      const bg = isFuture ? "#f3f4f6" : done ? habit.color : "#e5e7eb";
      const text = isFuture ? "" : done ? "✓" : "✗";
      const textColor = done && !isFuture ? "white" : "#9ca3af";
      return `<td style="background:${bg};color:${textColor};text-align:center;font-size:9px;padding:3px;border-radius:3px;border:1px solid white">${text}</td>`;
    }).join("");
    return `
      <tr>
        <td style="font-size:11px;font-weight:600;padding:4px 6px;white-space:nowrap;color:#111">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${habit.color};margin-right:5px"></span>
          ${habit.name}
        </td>
        ${cells}
        <td style="text-align:center;font-size:11px;font-weight:700;padding:4px 6px;color:#111">${completedCount}</td>
        <td style="text-align:center;font-size:11px;font-weight:700;padding:4px 6px;color:${rate >= 70 ? "#10b981" : rate >= 40 ? "#f59e0b" : "#ef4444"}">${rate}%</td>
        <td style="text-align:center;font-size:11px;padding:4px 6px;color:#111">${(habit as any).currentStreak ?? 0}🔥</td>
      </tr>`;
  }).join("");

  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
    const dow = dayNames[(startDay + i) % 7];
    return `<th style="font-size:8px;padding:3px 2px;text-align:center;color:#6b7280;min-width:18px">${i + 1}<br/><span style="opacity:0.6">${dow}</span></th>`;
  }).join("");

  // Summary stats
  let bestStreak = 0, topHabit = "", topRate = -1, worstHabit = "", worstRate = 101;
  let totalCheckins = 0;
  habitStats.forEach(({ habit, completedCount, rate }) => {
    totalCheckins += completedCount;
    const ls = (habit as any).longestStreak ?? 0;
    if (ls > bestStreak) bestStreak = ls;
    if (rate > topRate) { topRate = rate; topHabit = habit.name; }
    if (rate < worstRate) { worstRate = rate; worstHabit = habit.name; }
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Habits Report — ${monthName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, sans-serif; background: white; color: #111; padding: 32px; }
    @media print {
      body { padding: 16px; }
      @page { size: A4 landscape; margin: 12mm; }
    }
    h1 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; margin-bottom: 24px; }
    table { border-collapse: separate; border-spacing: 2px; width: 100%; }
    thead th { background: #f9fafb; }
    .summary { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat { background: #f9fafb; border-radius: 10px; padding: 12px 16px; flex: 1; min-width: 120px; }
    .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 22px; font-weight: 700; margin-top: 4px; }
    .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <h1>🔥 Habits Report</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })} &nbsp;·&nbsp; ${monthName}</p>

  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Check-ins</div>
      <div class="stat-value" style="color:#3b82f6">${totalCheckins}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Best Streak</div>
      <div class="stat-value" style="color:#f59e0b">${bestStreak} days</div>
    </div>
    <div class="stat">
      <div class="stat-label">Top Habit</div>
      <div class="stat-value" style="color:#10b981;font-size:14px">${topHabit} (${topRate}%)</div>
    </div>
    <div class="stat">
      <div class="stat-label">Needs Work</div>
      <div class="stat-value" style="color:#ef4444;font-size:14px">${worstHabit} (${worstRate}%)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;font-size:11px;padding:4px 6px">Habit</th>
        ${dayHeaders}
        <th style="font-size:10px;padding:4px 6px;min-width:36px">Done</th>
        <th style="font-size:10px;padding:4px 6px;min-width:36px">Rate</th>
        <th style="font-size:10px;padding:4px 6px;min-width:40px">Streak</th>
      </tr>
    </thead>
    <tbody>${gridRows}</tbody>
  </table>

  <div class="footer">Habits Tracker &nbsp;·&nbsp; Data is stored locally on your device</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
