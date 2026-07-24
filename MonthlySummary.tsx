import { useMemo } from "react";
import { Award, CheckCircle2, Download, Flame, TrendingDown, TrendingUp } from "lucide-react";
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
  const { month, year, stats } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const daysSoFar = isCurrentMonth ? today.getDate() : daysInMonth;

    const completions = storage.getCompletions();

    let totalCompletions = 0;
    let bestStreak = 0;
    let mostConsistent: { name: string; rate: number; color: string } | null = null;
    let leastConsistent: { name: string; rate: number; color: string } | null = null;

    habits.forEach((habit) => {
      let count = 0;
      for (let d = 1; d <= daysSoFar; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (completions.some((c) => c.habitId === habit.id && c.completedDate === dateStr)) count++;
      }
      totalCompletions += count;
      const rate = daysSoFar > 0 ? count / daysSoFar : 0;
      const streak = (habit as any).longestStreak ?? 0;
      if (streak > bestStreak) bestStreak = streak;

      if (!mostConsistent || rate > mostConsistent.rate) {
        mostConsistent = { name: habit.name, rate, color: habit.color };
      }
      if (!leastConsistent || rate < leastConsistent.rate) {
        leastConsistent = { name: habit.name, rate, color: habit.color };
      }
    });

    return {
      month,
      year,
      stats: { totalCompletions, bestStreak, mostConsistent, leastConsistent, daysSoFar, daysInMonth },
    };
  }, [habits, currentDate]);

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (habits.length === 0) return null;

  const cards = [
    {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Total Check-ins",
      value: stats.totalCompletions,
      sub: `across ${habits.length} habit${habits.length !== 1 ? "s" : ""}`,
      accent: "#3b82f6",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-300 dark:border-blue-800",
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Best Streak",
      value: `${stats.bestStreak}d`,
      sub: "all-time longest",
      accent: "#f59e0b",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-300 dark:border-amber-800",
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Top Habit",
      value: stats.mostConsistent
        ? `${Math.round((stats.mostConsistent as any).rate * 100)}%`
        : "—",
      sub: (stats.mostConsistent as any)?.name ?? "",
      accent: "#10b981",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-300 dark:border-green-800",
      dot: (stats.mostConsistent as any)?.color,
    },
    {
      icon: <TrendingDown className="w-4 h-4" />,
      label: "Needs Work",
      value: stats.leastConsistent
        ? `${Math.round((stats.leastConsistent as any).rate * 100)}%`
        : "—",
      sub: (stats.leastConsistent as any)?.name ?? "",
      accent: "#ef4444",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-300 dark:border-red-800",
      dot: (stats.leastConsistent as any)?.color,
    },
  ];

  return (
    <div className="mt-6 border rounded-2xl bg-card p-6" id="monthly-summary">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${card.bg} ${card.border}`}
          >
            <div className="flex items-center gap-1.5 mb-2" style={{ color: card.accent }}>
              {card.icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{card.label}</span>
            </div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: card.accent }}>
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {card.dot && (
                <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: card.dot }} />
              )}
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-right">
        Based on {stats.daysSoFar} of {stats.daysInMonth} days
      </div>
    </div>
  );
}
