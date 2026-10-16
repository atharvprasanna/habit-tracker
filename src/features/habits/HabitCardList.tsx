import type { ReactNode } from "react";
import { Check, Flame } from "lucide-react";

interface CardHabit {
  id: number;
  name: string;
  color: string;
  currentStreak: number;
  longestStreak: number;
}

interface Props {
  habits: CardHabit[];
  /** habitId -> { dateKey: true } */
  completionMap: Record<number, Record<string, boolean>>;
  /** Every day of the month being viewed (local midnight) */
  calendarDates: Date[];
  goals: Record<number, number>;
  todayKey: string;
  today: Date;
  dateKey: (d: Date) => string;
  accentColor: string;
  onToggle: (habitId: number, dateKey: string) => void;
  /** Renders the ⋮ options button + menu for a habit */
  renderMenu: (habit: CardHabit) => ReactNode;
}

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Mobile-first habit list: one card per habit with a big tap target for today,
 * a 7-day strip for quick back-fill, streak and monthly progress.
 */
export default function HabitCardList({
  habits,
  completionMap,
  calendarDates,
  goals,
  todayKey,
  today,
  dateKey,
  accentColor,
  onToggle,
  renderMenu,
}: Props) {
  const viewingCurrentMonth = calendarDates.some((d) => dateKey(d) === todayKey);
  // 7-day strip ends today, or on the last day of the month when browsing another month
  const anchor = viewingCurrentMonth ? today : calendarDates[calendarDates.length - 1];
  const strip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - (6 - i));
    return d;
  });
  const daysSoFar = calendarDates.filter((d) => d <= today).length;

  return (
    <ul className="space-y-3">
      {habits.map((habit) => {
        const color = habit.color || accentColor;
        const done = completionMap[habit.id] ?? {};
        const doneToday = !!done[todayKey];
        const count = calendarDates.filter((d) => done[dateKey(d)]).length;
        const goal = goals[habit.id] || 0;
        const target = goal > 0 ? goal : Math.max(daysSoFar, 1);
        const pct = Math.min(100, Math.round((count / target) * 100));

        return (
          <li
            key={habit.id}
            className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm"
            style={{ borderLeft: `5px solid ${color}` }}
          >
            {/* Top row: name, streak, menu */}
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold leading-tight">{habit.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Flame
                    className="h-3.5 w-3.5"
                    style={{ color: habit.currentStreak > 0 ? "#f97316" : undefined }}
                  />
                  {habit.currentStreak > 0 ? (
                    <span>
                      <b className="text-foreground">{habit.currentStreak}</b>-day streak
                      {habit.longestStreak > habit.currentStreak && ` · best ${habit.longestStreak}`}
                    </span>
                  ) : (
                    <span>Start a streak today</span>
                  )}
                </div>
              </div>

              {/* Big check button for today */}
              {viewingCurrentMonth && (
                <button
                  onClick={() => onToggle(habit.id, todayKey)}
                  aria-pressed={doneToday}
                  aria-label={`${doneToday ? "Undo" : "Mark"} ${habit.name} for today`}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90"
                  style={{
                    borderColor: color,
                    backgroundColor: doneToday ? color : "transparent",
                    boxShadow: doneToday ? `0 4px 14px ${color}55` : "none",
                  }}
                >
                  {doneToday && <Check key="on" className="ht-pop h-7 w-7 text-white" strokeWidth={3} />}
                </button>
              )}
              {renderMenu(habit)}
            </div>

            {/* 7-day strip */}
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {strip.map((d) => {
                const key = dateKey(d);
                const isDone = !!done[key];
                const isFuture = d > today;
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    disabled={isFuture}
                    onClick={() => onToggle(habit.id, key)}
                    aria-pressed={isDone}
                    aria-label={`${d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}${isDone ? ", done" : ""}`}
                    className="flex flex-col items-center gap-1 rounded-xl py-1.5 transition-transform active:scale-90 disabled:opacity-35"
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">{WEEKDAY[d.getDay()]}</span>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: isDone ? color : "transparent",
                        color: isDone ? "white" : undefined,
                        border: `1.5px solid ${isDone ? color : isToday ? color : "var(--border, #e5e7eb)"}`,
                      }}
                    >
                      {isDone ? <Check key="on" className="ht-pop h-4 w-4" strokeWidth={3} /> : d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Monthly progress */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{goal > 0 ? `${count} / ${goal} goal` : `${count} of ${daysSoFar} days`}</span>
                <span className="font-medium text-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
