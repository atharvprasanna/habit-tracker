import { toDateKey, todayKey } from "../../lib/dates";

interface Props {
  year: number;
  completedSet: Set<string>;
  accentColor: string;
  /** Completed days in `year` */
  yearDone: number;
  /** 365 or 366 */
  daysInYear: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Phone-friendly "Year in Review": twelve small month calendars in two columns.
 * Everything fits the screen with no sideways scrolling, and each month shows its total.
 */
export default function YearMonthCalendars({ year, completedSet, accentColor, yearDone, daysInYear }: Props) {
  const today = todayKey();
  const yearPct = Math.round((yearDone / daysInYear) * 100);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {MONTH_NAMES.map((name, month) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
          let done = 0;

          const cells = Array.from({ length: daysInMonth }, (_, i) => {
            const key = toDateKey(new Date(year, month, i + 1));
            const completed = completedSet.has(key);
            if (completed) done++;
            return { key, day: i + 1, completed, future: key > today, isToday: key === today };
          });

          return (
            <div key={name} className="rounded-xl border bg-background p-2.5">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-semibold">{name}</span>
                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                  {done}/{daysInMonth}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-[3px]">
                {WEEKDAYS.map((d, i) => (
                  <div key={i} className="text-center text-[8px] font-medium text-muted-foreground">{d}</div>
                ))}
                {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} />)}
                {cells.map((c) => (
                  <div
                    key={c.key}
                    title={c.key}
                    className={`flex aspect-square items-center justify-center rounded-[4px] text-[8px] leading-none ${
                      c.completed ? "font-semibold text-white" : c.future ? "border border-dashed border-border/60 text-muted-foreground/40" : "bg-muted text-muted-foreground"
                    }`}
                    style={{
                      backgroundColor: c.completed ? accentColor : undefined,
                      boxShadow: c.isToday ? `0 0 0 1.5px ${accentColor}` : undefined,
                    }}
                  >
                    {c.day}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Yearly total */}
      <div className="mt-4 rounded-xl border bg-background p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-muted-foreground">{year} total</span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: accentColor }}>{yearPct}%</span>
        </div>
        <div className="mt-0.5 text-lg font-bold tabular-nums">
          {yearDone} <span className="text-sm font-medium text-muted-foreground">out of {daysInYear} days</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${yearPct}%`, backgroundColor: accentColor }} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: accentColor }} /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-muted" /> Missed
        </span>
      </div>
    </div>
  );
}
