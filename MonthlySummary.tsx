import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Download, TrendingDown, TrendingUp } from "lucide-react";
import { storage } from "./storage";
import { exportMonthlyPDF } from "./PdfExport";

interface Habit {
  id: number;
  name: string;
  color: string;
  currentStreak?: number;
  longestStreak?: number;
}

interface Props {
  habits: Habit[];
  currentDate: Date;
}

export default function MonthlySummary({ habits, currentDate }: Props) {
  const { data: completions = [] } = useQuery({
    queryKey: ["completions", "all"],
    queryFn: () => storage.getCompletions(),
  });

  const { month, year, habitStats, summary } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Use the same UTC date-key approach as Dashboard.tsx so counts match
    const todayUTC = new Date().toISOString().split("T")[0];
    const calendarDates = Array.from({ length: daysInMonth }, (_, i) => {
      const utcKey = new Date(year, month, i + 1).toISOString().split("T")[0];
      return { utcKey, isPast: utcKey <= todayUTC };
    });
    const daysSoFar = calendarDates.filter((d) => d.isPast).length;

    let totalCompletions = 0;

    let mostConsistent: { name: string; rate: number; color: string } | null = null;
    let leastConsistent: { name: string; rate: number; color: string } | null = null;

    const habitStats = habits.map((habit) => {
      const count = calendarDates.filter(
        ({ utcKey, isPast }) =>
          isPast && completions.some((c) => c.habitId === habit.id && c.completedDate === utcKey)
      ).length;
      const rate = daysSoFar > 0 ? count / daysSoFar : 0;
      totalCompletions += count;

      if (!mostConsistent || rate > mostConsistent.rate)
        mostConsistent = { name: habit.name, rate, color: habit.color };
      if (!leastConsistent || rate < leastConsistent.rate)
        leastConsistent = { name: habit.name, rate, color: habit.color };

      return { habit, count, rate, daysSoFar };
    });

    return {
      month, year,
      habitStats,
      summary: { totalCompletions, mostConsistent, leastConsistent, daysSoFar, daysInMonth },
    };
  }, [habits, currentDate, completions]);

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (habits.length === 0) return null;

  return (
    <div className="mt-6 border rounded-2xl bg-card p-6" id="monthly-summary">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Award className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-semibold">Monthly Summary</h2>
        <span className="text-sm text-muted-foreground ml-1">— {monthName}</span>
        <button
          onClick={() => exportMonthlyPDF(habits as any, currentDate)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Export as PDF"
        >
          <Download className="w-3.5 h-3.5" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* ── Check-ins breakdown ── */}
        <div className="rounded-xl border p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 sm:col-span-1">
          <div className="flex items-center gap-1.5 mb-3 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Check-ins</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400 mb-0.5">
            {summary.totalCompletions}
          </div>
          <div className="text-xs text-muted-foreground mb-4">
            across {habits.length} habit{habits.length !== 1 ? "s" : ""} · {summary.daysSoFar} days tracked
          </div>
          {/* Per-habit rows */}
          <div className="space-y-2.5">
            {habitStats.map(({ habit, count, rate }) => (
              <div key={habit.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="text-xs font-medium truncate">{habit.name}</span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0 ml-2">
                    {count}d · {Math.round(rate * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round(rate * 100)}%`, backgroundColor: habit.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Habit ── */}
        <div className="rounded-xl border p-4 bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800">
          <div className="flex items-center gap-1.5 mb-2 text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Top Habit</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
            {summary.mostConsistent ? `${Math.round((summary.mostConsistent as any).rate * 100)}%` : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            {(summary.mostConsistent as any)?.color && (
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (summary.mostConsistent as any).color }} />
            )}
            {(summary.mostConsistent as any)?.name ?? ""}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-green-100 dark:bg-green-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.round(((summary.mostConsistent as any)?.rate ?? 0) * 100)}%` }}
            />
          </div>
        </div>

        {/* ── Needs Work ── */}
        <div className="rounded-xl border p-4 bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800">
          <div className="flex items-center gap-1.5 mb-2 text-red-500 dark:text-red-400">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Needs Work</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-red-500 dark:text-red-400">
            {summary.leastConsistent ? `${Math.round((summary.leastConsistent as any).rate * 100)}%` : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            {(summary.leastConsistent as any)?.color && (
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (summary.leastConsistent as any).color }} />
            )}
            {(summary.leastConsistent as any)?.name ?? ""}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-red-100 dark:bg-red-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-red-400 transition-all"
              style={{ width: `${Math.round(((summary.leastConsistent as any)?.rate ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-right">
        Based on {summary.daysSoFar} of {summary.daysInMonth} days
      </div>
    </div>
  );
}
