import { BarChart3, CircleHelp, Home, Plus, Settings } from "lucide-react";
import { vibrate } from "../../lib/haptics";

interface Props {
  onHabits: () => void;
  onAdd: () => void;
  onInsights: () => void;
  onSettings: () => void;
  onHelp: () => void;
}

/** Fixed bottom tab bar for phones. Hidden from the `md` breakpoint up. */
export default function BottomNav({ onHabits, onAdd, onInsights, onSettings, onHelp }: Props) {
  const tap = (fn: () => void) => () => {
    vibrate(8);
    fn();
  };

  const tabClass =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-transform active:scale-90 active:text-foreground";

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-md items-end px-2">
        <button className={tabClass} onClick={tap(onHabits)}>
          <Home className="h-5 w-5" />
          Habits
        </button>
        <button className={tabClass} onClick={tap(onInsights)}>
          <BarChart3 className="h-5 w-5" />
          Insights
        </button>

        {/* Raised center action */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={tap(onAdd)}
            aria-label="Add habit"
            className="ht-accent-btn -mt-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-black/20 transition-transform active:scale-90"
            style={{ backgroundColor: "#f97316" }}
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>

        <button className={tabClass} onClick={tap(onSettings)}>
          <Settings className="h-5 w-5" />
          Settings
        </button>
        <button className={tabClass} onClick={tap(onHelp)}>
          <CircleHelp className="h-5 w-5" />
          Help
        </button>
      </div>
    </nav>
  );
}
