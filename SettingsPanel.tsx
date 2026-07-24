import { Download } from "lucide-react";
import { AppSettings, ACCENT_PRESETS, FontChoice } from "./useSettings";
import { storage } from "./storage";

interface Props {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
}

const FONT_OPTIONS: { value: FontChoice; label: string; family: string }[] = [
  { value: "default", label: "Default", family: "system-ui, sans-serif" },
  { value: "rounded", label: "Rounded", family: '"Nunito", sans-serif' },
  { value: "mono",    label: "Mono",    family: '"JetBrains Mono", monospace' },
];

export function SettingsPanel({ settings, onUpdate, onClose }: Props) {

  const handleExportCSV = () => {
    const habits = storage.getHabits();
    const completions = storage.getCompletions();

    const rows: string[] = ["Habit Name,Date,Status"];
    habits.forEach((habit) => {
      const doneSet = new Set(
        completions
          .filter((c) => c.habitId === habit.id)
          .map((c) => c.completedDate)
      );
      doneSet.forEach((date) => {
        rows.push(`"${habit.name.replace(/"/g, '""')}",${date},Completed`);
      });
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const section = "mb-6";
  const label = "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block";
  const card = (active: boolean) =>
    `flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm transition-all cursor-pointer ${
      active
        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
        : "border-border hover:border-muted-foreground text-foreground"
    }`;

  return (
    <div className="space-y-0">

      {/* Font */}
      <div className={section}>
        <span className={label}>Font</span>
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map(({ value, label: l, family }) => (
            <button
              key={value}
              onClick={() => onUpdate({ font: value })}
              className={card(settings.font === value)}
            >
              <span className="text-2xl font-semibold leading-none" style={{ fontFamily: family }}>
                Ag
              </span>
              <span className="text-xs">{l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent colour */}
      <div className={section}>
        <span className={label}>Accent colour</span>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_PRESETS.map(({ label: l, value }) => (
            <button
              key={value}
              title={l}
              onClick={() => onUpdate({ accentColor: value })}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: value,
                boxShadow:
                  settings.accentColor === value
                    ? `0 0 0 2px white, 0 0 0 4px ${value}`
                    : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Data / Export */}
      <div className={section}>
        <span className={label}>Data</span>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm hover:bg-muted transition-colors w-full"
        >
          <Download className="w-4 h-4 text-muted-foreground" />
          <span>Export all data as CSV</span>
        </button>
      </div>

      {/* Done */}
      <div className="pt-2 border-t">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors ht-accent-btn"
        >
          Done
        </button>
      </div>
    </div>
  );
}
