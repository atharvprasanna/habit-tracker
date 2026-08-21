import { storage } from "./storage";

interface Habit {
  id: number;
  name: string;
  color: string;
  currentStreak?: number;
  longestStreak?: number;
}

export async function exportMonthlyPDF(habits: Habit[], currentDate: Date) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayUTC = new Date().toISOString().split("T")[0]; // UTC date key, matches how app stores check-ins

  const completions = await storage.getCompletions();
  const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Build calendar dates using the same UTC-key approach as Dashboard.tsx
  // Each Date is local midnight; toISOString() gives the UTC key the app stores
  const calendarDates: { localDate: Date; utcKey: string; isPast: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const localDate = new Date(year, month, d); // local midnight
    const utcKey = localDate.toISOString().split("T")[0]; // UTC date string, same as Dashboard
    calendarDates.push({ localDate, utcKey, isPast: utcKey <= todayUTC });
  }
  const daysSoFar = calendarDates.filter((d) => d.isPast).length;

  // Build per-habit stats using UTC keys to match stored completions
  const habitStats = habits.map((habit) => {
    const days: boolean[] = calendarDates.map(({ utcKey }) =>
      completions.some((c) => c.habitId === habit.id && c.completedDate === utcKey)
    );
    const completedCount = calendarDates.filter(({ isPast }, i) => isPast && days[i]).length;
    const rate = daysSoFar > 0 ? Math.round((completedCount / daysSoFar) * 100) : 0;
    const streak = (habit as any).currentStreak ?? 0;
    return { habit, days, completedCount, rate, streak };
  });

  // Summary numbers
  let totalCheckins = 0;
  let topHabit = "", topRate = -1;
  let worstHabit = "", worstRate = 101;
  habitStats.forEach(({ habit, completedCount, rate }) => {
    totalCheckins += completedCount;
    if (rate > topRate)   { topRate = rate;   topHabit = habit.name; }
    if (rate < worstRate) { worstRate = rate; worstHabit = habit.name; }
  });

  // Day header row — use local day-of-week for display
  const jan1dow = new Date(year, month, 1).getDay();
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
    const dow = DAY_ABBR[(jan1dow + i) % 7];
    const isSat = dow === "Sa", isSun = dow === "Su";
    const weekend = isSat || isSun ? "color:#94a3b8;" : "";
    return `<th style="font-size:9px;padding:4px 2px;text-align:center;font-weight:600;min-width:22px;${weekend}">${i + 1}<br/><span style="font-weight:400;font-size:8px;opacity:0.7">${dow}</span></th>`;
  }).join("");

  // Habit rows — coloured squares for done, grey for missed, faded for future
  const habitRows = habitStats.map(({ habit, days, completedCount, rate, streak }) => {
    const cells = Array.from({ length: daysInMonth }, (_, i) => {
      const isFuture = !calendarDates[i].isPast;
      const done = days[i];
      if (isFuture) {
        return `<td style="padding:3px 2px;text-align:center"><div style="width:14px;height:14px;border-radius:3px;border:1px dashed #cbd5e1;margin:auto"></div></td>`;
      }
      if (done) {
        // Filled square with colour + white checkmark via unicode (more print-safe than SVG in flex)
        return `<td style="padding:3px 2px;text-align:center"><div style="width:14px;height:14px;border-radius:3px;background-color:${habit.color};margin:auto;line-height:14px;text-align:center;font-size:9px;color:white;font-weight:700">✓</div></td>`;
      }
      return `<td style="padding:3px 2px;text-align:center"><div style="width:14px;height:14px;border-radius:3px;background-color:#e2e8f0;margin:auto"></div></td>`;
    }).join("");

    const rateColor = rate >= 70 ? "#10b981" : rate >= 40 ? "#f59e0b" : "#ef4444";
    return `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:6px 10px;white-space:nowrap;font-size:12px;font-weight:600">
          <div style="display:flex;align-items:center;gap:7px">
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${habit.color};flex-shrink:0"></span>
            ${habit.name}
          </div>
        </td>
        ${cells}
        <td style="text-align:center;font-size:13px;font-weight:700;padding:6px 8px;color:#1e293b">${completedCount}</td>
        <td style="text-align:center;font-size:13px;font-weight:700;padding:6px 8px;color:${rateColor}">${rate}%</td>
        <td style="text-align:center;font-size:12px;padding:6px 8px;color:#1e293b">${streak} 🔥</td>
      </tr>`;
  }).join("");

  // Per-habit breakdown for the check-ins summary card
  const breakdownRows = habitStats.map(({ habit, completedCount, rate }) => {
    const barWidth = Math.round(rate);
    return `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${habit.color}"></span>
            ${habit.name}
          </div>
          <span style="font-size:11px;color:#64748b">${completedCount}d · ${rate}%</span>
        </div>
        <div style="height:5px;border-radius:99px;background:#e2e8f0;overflow:hidden">
          <div style="height:100%;border-radius:99px;background:${habit.color};width:${barWidth}%"></div>
        </div>
      </div>`;
  }).join("");

  const topRateColor = topRate >= 70 ? "#10b981" : topRate >= 40 ? "#f59e0b" : "#ef4444";
  const worstRateColor = worstRate >= 70 ? "#10b981" : worstRate >= 40 ? "#f59e0b" : "#ef4444";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Habits Report — ${monthName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
    @media print {
      body { background: white; }
      @page { size: A4 landscape; margin: 10mm 12mm; }
      .no-print { display: none; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    .page { max-width: 1100px; margin: 0 auto; padding: 32px; }
    .header { margin-bottom: 24px; }
    .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; display:flex;align-items:center;gap:10px }
    .header p { font-size: 13px; color: #64748b; margin-top: 5px; }
    .summary-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .card { background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; }
    .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px; display:flex;align-items:center;gap:5px }
    .card-value { font-size: 28px; font-weight: 800; margin-bottom: 2px; }
    .card-sub { font-size: 11px; color: #64748b; margin-bottom: 14px; }
    .table-wrap { background: white; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
    table { border-collapse: collapse; width: 100%; }
    thead tr { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
    thead th:first-child { text-align: left; padding: 8px 10px; font-size: 11px; }
    .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
    .bar-bg { height: 5px; border-radius: 99px; background: #e2e8f0; overflow: hidden; margin-top: 12px; }
    .bar-fill { height: 100%; border-radius: 99px; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <h1>🔥 Habits Report</h1>
    <p>Generated on ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })} &nbsp;·&nbsp; ${monthName} &nbsp;·&nbsp; Based on ${daysSoFar} of ${daysInMonth} days</p>
  </div>

  <!-- Summary cards -->
  <div class="summary-grid">
    <!-- Check-ins breakdown -->
    <div class="card" style="border-color:#bfdbfe;background:#eff6ff">
      <div class="card-label" style="color:#3b82f6">✅ Total Check-ins</div>
      <div class="card-value" style="color:#3b82f6">${totalCheckins}</div>
      <div class="card-sub">across ${habits.length} habit${habits.length !== 1 ? "s" : ""}</div>
      ${breakdownRows}
    </div>

    <!-- Top habit -->
    <div class="card" style="border-color:#bbf7d0;background:#f0fdf4">
      <div class="card-label" style="color:#10b981">📈 Top Habit</div>
      <div class="card-value" style="color:${topRateColor}">${topRate}%</div>
      <div class="card-sub">${topHabit}</div>
      <div class="bar-bg"><div class="bar-fill" style="width:${topRate}%;background:#10b981"></div></div>
    </div>

    <!-- Needs work -->
    <div class="card" style="border-color:#fecaca;background:#fff1f2">
      <div class="card-label" style="color:#ef4444">📉 Needs Work</div>
      <div class="card-value" style="color:${worstRateColor}">${worstRate}%</div>
      <div class="card-sub">${worstHabit}</div>
      <div class="bar-bg"><div class="bar-fill" style="width:${worstRate}%;background:#ef4444"></div></div>
    </div>
  </div>

  <!-- Habit grid table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;font-weight:700;padding:8px 10px;min-width:100px">Habit</th>
          ${dayHeaders}
          <th style="font-size:10px;padding:8px;min-width:40px;font-weight:700">Done</th>
          <th style="font-size:10px;padding:8px;min-width:40px;font-weight:700">Rate</th>
          <th style="font-size:10px;padding:8px;min-width:48px;font-weight:700">Streak</th>
        </tr>
      </thead>
      <tbody>${habitRows}</tbody>
    </table>
  </div>

  <div class="footer">Habits Tracker &nbsp;·&nbsp; Your data is stored privately on your device</div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
