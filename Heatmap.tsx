import { useMemo, useState } from "react";
import { storage } from "./storage";

interface Props {
  habits: { id: number; name: string; color: string }[];
  refreshKey?: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["Mon","","Wed","","Fri","","Sun"];

// Layout constants
const CELL = 11;   // px — cell width & height
const GAP  = 2;    // px — gap between cells
const WEEK_W = CELL + GAP; // 13px per week column
const DAY_COL_W = 28; // px — width of the day-label column on the left

// Format a local date as YYYY-MM-DD (no UTC conversion)
function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Heatmap({ habits, refreshKey }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const year = new Date().getFullYear();

  const completedSet = useMemo<Set<string>>(() => {
    if (!selectedId) return new Set();
    const completions = storage.getCompletions();
    return new Set(
      completions.filter((c) => c.habitId === selectedId).map((c) => c.completedDate)
    );
  }, [selectedId, refreshKey]); // refreshKey triggers re-read on every check-in

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
      const dateStr = localDateStr(cursor);          // ← local time, no UTC shift
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

    // Compute pixel width each month label should span
    const monthLabels = rawLabels.map(({ month, col }, i) => {
      const nextCol = i < rawLabels.length - 1 ? rawLabels[i + 1].col : cells.length;
      return { month, col, widthPx: (nextCol - col) * WEEK_W };
    });

    return { weeks: cells, monthLabels };
  }, [year, completedSet]);

  const selectedHabit = habits.find((h) => h.id === selectedId);
  const accentColor = selectedHabit?.color ?? "#f97316";

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  return (
    <div className="mt-6 border rounded-2xl bg-card p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <span className="text-lg">📅</span> Year in Review
        </h2>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-1.5 border rounded-xl bg-background text-foreground text-sm"
        >
          <option value="">Select a habit…</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      {!selectedId ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Select a habit to see your {year} contribution map
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: weeks.length * WEEK_W + DAY_COL_W + 16 }}>

            {/* Month label row — flex, each label exactly as wide as its span */}
            <div className="flex" style={{ marginLeft: DAY_COL_W + GAP }}>
              {monthLabels.map(({ month, widthPx }, i) => (
                <div
                  key={i}
                  className="text-[10px] text-muted-foreground overflow-hidden shrink-0"
                  style={{ width: widthPx }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Grid: day labels + week columns */}
            <div className="flex mt-1" style={{ gap: GAP }}>

              {/* Day-of-week labels */}
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

              {/* Week columns */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col shrink-0" style={{ gap: GAP }}>
                  {week.map((cell, di) => {
                    if (!cell.dateStr) {
                      return <div key={di} style={{ width: CELL, height: CELL }} />;
                    }
                    const bg = cell.isFuture
                      ? undefined
                      : cell.completed
                      ? accentColor
                      : undefined;
                    return (
                      <div
                        key={di}
                        className={`rounded-[2px] cursor-pointer transition-opacity hover:opacity-70 ${
                          cell.isFuture
                            ? "border border-dashed border-border/40"
                            : cell.completed
                            ? ""
                            : "bg-muted"
                        }`}
                        style={{ width: CELL, height: CELL, backgroundColor: bg }}
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
            <div className="flex items-center gap-3 mt-3 justify-end" style={{ marginLeft: DAY_COL_W }}>
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
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
