import { useMemo, useState } from "react";
import { toDateKey } from "../../lib/dates";
import { useCompletions } from "./useCompletions";
import YearMonthCalendars from "./YearMonthCalendars";

interface Props {
  habits: { id: number; name: string; color: string }[];
  refreshKey?: number;
  /** When provided, the heatmap uses this habit and hides its own selector */
  habitId?: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["Mon","","Wed","","Fri","","Sun"];

// Layout constants
const CELL = 11;   // px — cell width & height
const GAP  = 2;    // px — gap between cells
const WEEK_W = CELL + GAP; // 13px per week column
const DAY_COL_W = 28; // px — width of the day-label column on the left

export default function Heatmap({ habits, refreshKey, habitId }: Props) {
  const [internalId, setInternalId] = useState<number | null>(null);
  const selectedId = habitId ?? internalId;
  const year = new Date().getFullYear();

  const { data: allCompletions = [] } = useCompletions();

  const completedSet = useMemo<Set<string>>(() => {
    if (!selectedId) return new Set();
    return new Set(
      allCompletions.filter((c) => c.habitId === selectedId).map((c) => c.completedDate)
    );
  }, [selectedId, refreshKey, allCompletions]);

  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  const yearDone = useMemo(
    () => [...completedSet].filter((k) => k.startsWith(`${year}-`)).length,
    [completedSet, year]
  );

  const { weeks, monthLabels } = useMemo(() => {
    const jan1 = new Date(year, 0, 1);
    const startOffset = (jan1.getDay() + 6) % 7; // Mon=0 … Sun=6
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const cells: { dateStr: string | null; completed: boolean; isFuture: boolean }[][] = [];
    let week: typeof cells[0] = [];

    // Leading empty cells so the first week starts on Monday
    for (let i = 0; i < startOffset; i++) {
      week.push({ dateStr: null, completed: false, isFuture: false });
    }

    const cursor = new Date(year, 0, 1);
    while (cursor.getFullYear() === year) {
      const dateStr = toDateKey(cursor);
      const isFuture = cursor > today;
      week.push({ dateStr, completed: completedSet.has(dateStr), isFuture });
      if (week.length === 7) { cells.push(week); week = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    while (week.length > 0 && week.length < 7) {
      week.push({ dateStr: null, completed: false, isFuture: false });
    }
    if (week.length) cells.push(week);

    // Month labels — parse from dateStr directly (no new Date() UTC issue)
    const rawLabels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    cells.forEach((w, wi) => {
      w.forEach((c) => {
        if (!c.dateStr) return;
        const m = parseInt(c.dateStr.split("-")[1], 10) - 1;
        if (m !== lastMonth) {
          lastMonth = m;
          rawLabels.push({ month: MONTHS[m], col: wi });
        }
      });
    });

    // Keep col index for proportional flex sizing in the render
    const monthLabels = rawLabels.map(({ month, col }) => ({ month, col }));

    return { weeks: cells, monthLabels };
  }, [year, completedSet]);

  const selectedHabit = habits.find((h) => h.id === selectedId);
  const accentColor = selectedHabit?.color ?? "#f97316";

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // When controlled externally (habitId prop), render just the grid with no card wrapper
  const controlled = habitId !== undefined;

  const inner = (
    <>
      {/* Standalone header + selector — only when not controlled by parent */}
      {!controlled && (
        <div className="flex items-center gap-4 mb-5">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">📅</span> Year in Review
          </h2>
          <select
            value={internalId ?? ""}
            onChange={(e) => setInternalId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 border rounded-xl bg-background text-foreground text-sm"
          >
            <option value="">Select a habit…</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      )}

      {!selectedId ? (
        controlled ? null : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Select a habit above to see your {year} contribution map
        </div>
        )
      ) : (
        <>
        {/* Phones: twelve compact month calendars (fits the screen, no scrolling) */}
        <div className="md:hidden">
          <YearMonthCalendars
            year={year}
            completedSet={completedSet}
            accentColor={accentColor}
            yearDone={yearDone}
            daysInYear={daysInYear}
          />
        </div>

        {/* Tablet / desktop: contribution-style year grid */}
        <div className="hidden w-full md:block">
          {/* Month label row — proportional flex widths based on week count */}
          <div className="flex" style={{ marginLeft: DAY_COL_W + GAP }}>
            {monthLabels.map(({ month, col }, i) => {
              const nextCol = i < monthLabels.length - 1 ? monthLabels[i + 1].col : weeks.length;
              const spanWeeks = nextCol - col;
              return (
                <div
                  key={i}
                  className="text-[10px] text-muted-foreground overflow-hidden"
                  style={{ flex: spanWeeks, minWidth: 0 }}
                >
                  {month}
                </div>
              );
            })}
          </div>

          {/* Grid: day labels + week columns */}
          <div className="flex mt-1 w-full" style={{ gap: GAP }}>

            {/* Day-of-week labels — fixed width */}
            <div className="flex flex-col shrink-0" style={{ gap: GAP, width: DAY_COL_W }}>
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className="text-[10px] text-muted-foreground text-right pr-1 flex items-center justify-end"
                  style={{ height: CELL }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Week columns — flex: 1 each so they spread to fill full width */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col flex-1" style={{ gap: GAP }}>
                {week.map((cell, di) => {
                  if (!cell.dateStr) {
                    return <div key={di} style={{ height: CELL }} />;
                  }
                  const bg = cell.isFuture ? undefined : cell.completed ? accentColor : undefined;
                  return (
                    <div
                      key={di}
                      className={`rounded-[2px] cursor-pointer transition-opacity hover:opacity-70 w-full ${
                        cell.isFuture
                          ? "border border-dashed border-border/40"
                          : cell.completed ? "" : "bg-muted"
                      }`}
                      style={{ height: CELL, backgroundColor: bg }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const [y, m, d] = cell.dateStr!.split("-").map(Number);
                        const label = new Date(y, m - 1, d).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        });
                        setTooltip({
                          text: `${label} — ${cell.completed ? "✓ Completed" : cell.isFuture ? "upcoming" : "✗ Missed"}`,
                          x: rect.left + window.scrollX,
                          y: rect.top + window.scrollY - 36,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 justify-end">
            <div className="mr-auto text-xs text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{yearDone}</span> out of {daysInYear} days in {year}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="rounded-[2px]" style={{ width: CELL, height: CELL, backgroundColor: accentColor }} />
              Completed
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="rounded-[2px] bg-muted" style={{ width: CELL, height: CELL }} />
              Missed
            </div>
          </div>
        </div>
        </>
      )}

      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );

  // Controlled (embedded): no wrapper card — parent supplies it
  if (controlled) return <>{inner}</>;

  // Standalone: wrap in its own card
  return <div className="mt-6 border rounded-2xl bg-card p-6">{inner}</div>;
}
