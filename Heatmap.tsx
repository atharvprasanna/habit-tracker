import { useMemo, useState } from "react";
import { storage } from "./storage";

interface Props {
  habits: { id: number; name: string; color: string }[];
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Mon","","Wed","","Fri","","Sun"];

export default function Heatmap({ habits }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const year = new Date().getFullYear();

  // Build set of completed dates for selected habit
  const completedSet = useMemo<Set<string>>(() => {
    if (!selectedId) return new Set();
    const completions = storage.getCompletions();
    return new Set(
      completions
        .filter((c) => c.habitId === selectedId)
        .map((c) => c.completedDate)
    );
  }, [selectedId]);

  // Build the 52-week grid (Sun-origin, padded like GitHub)
  const { weeks, monthLabels } = useMemo(() => {
    const jan1 = new Date(year, 0, 1);
    // Offset so week starts on Monday (GitHub uses Sunday; we use Monday)
    const startOffset = (jan1.getDay() + 6) % 7; // Mon=0
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const cells: { dateStr: string | null; completed: boolean; isFuture: boolean }[][] = [];
    let week: typeof cells[0] = [];

    // Pad first week
    for (let i = 0; i < startOffset; i++) week.push({ dateStr: null, completed: false, isFuture: false });

    const cursor = new Date(jan1);
    while (cursor.getFullYear() === year) {
      const dateStr = cursor.toISOString().split("T")[0];
      const isFuture = cursor > today;
      week.push({ dateStr, completed: completedSet.has(dateStr), isFuture });
      if (week.length === 7) { cells.push(week); week = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    // Pad last week
    while (week.length > 0 && week.length < 7) week.push({ dateStr: null, completed: false, isFuture: false });
    if (week.length) cells.push(week);

    // Month labels: find which week column each month starts in
    const labels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    cells.forEach((w, wi) => {
      w.forEach((c) => {
        if (!c.dateStr) return;
        const d = new Date(c.dateStr);
        if (d.getMonth() !== lastMonth) {
          lastMonth = d.getMonth();
          labels.push({ month: MONTHS[lastMonth], col: wi });
        }
      });
    });

    return { weeks: cells, monthLabels: labels };
  }, [year, completedSet]);

  const selectedHabit = habits.find((h) => h.id === selectedId);
  const accentColor = selectedHabit?.color ?? "#f97316";

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  return (
    <div className="mt-6 border rounded-2xl bg-card p-6">
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
          <div style={{ minWidth: weeks.length * 14 + 32 }}>
            {/* Month labels */}
            <div className="flex mb-1 ml-8">
              {monthLabels.map(({ month, col }, i) => (
                <div
                  key={i}
                  className="text-xs text-muted-foreground absolute"
                  style={{ marginLeft: col * 14 }}
                >
                  {month}
                </div>
              ))}
              <div style={{ height: 16 }} />
            </div>

            <div className="flex gap-0.5 ml-8 mt-4">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1.5">
                {DAYS.map((d, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground h-[11px] leading-[11px] w-6 text-right pr-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((cell, di) => {
                    if (!cell.dateStr) {
                      return <div key={di} className="w-[11px] h-[11px]" />;
                    }
                    const bg = cell.isFuture
                      ? "transparent"
                      : cell.completed
                      ? accentColor
                      : "var(--color-muted)";
                    const border = cell.isFuture ? "1px dashed var(--color-border)" : "none";
                    return (
                      <div
                        key={di}
                        className="w-[11px] h-[11px] rounded-[2px] transition-opacity cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: bg, border, opacity: cell.isFuture ? 0.3 : 1 }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const d = new Date(cell.dateStr!);
                          setTooltip({
                            text: `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${cell.completed ? "✓ Completed" : "✗ Missed"}`,
                            x: rect.left + window.scrollX,
                            y: rect.top + window.scrollY - 32,
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
            <div className="flex items-center gap-2 mt-3 ml-8 justify-end">
              <span className="text-xs text-muted-foreground">Less</span>
              {[0.15, 0.4, 0.65, 0.85, 1].map((op, i) => (
                <div
                  key={i}
                  className="w-[11px] h-[11px] rounded-[2px]"
                  style={{ backgroundColor: i === 0 ? "var(--color-muted)" : accentColor, opacity: i === 0 ? 1 : op }}
                />
              ))}
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
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
