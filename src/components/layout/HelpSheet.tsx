import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { InfoModal, INFO_TOPICS, type InfoTopic } from "./InfoModal";

const BLURBS: Record<string, string> = {
  what: "A quick tour of the app",
  how: "Add habits, tick days, set goals",
  why: "The science behind tracking",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Phone "Help" bottom sheet opened from the bottom navigation.
 * Lists the three help topics (the same ones the desktop side navigation shows).
 */
export default function HelpSheet({ open, onClose }: Props) {
  const [topic, setTopic] = useState<InfoTopic | null>(null);

  const pick = (t: InfoTopic) => {
    onClose();
    setTopic(t);
  };

  return (
    <>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
            <div
              role="dialog"
              aria-label="How it works"
              className="ht-sheet-up safe-bottom w-full rounded-t-3xl bg-background p-4 pb-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">How it works</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-2">
                {INFO_TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => pick(t)}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-transform active:scale-[0.98]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${t.accent}1f`, color: t.accent }}
                    >
                      {t.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{BLURBS[t.id]}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {topic && <InfoModal topic={topic} onClose={() => setTopic(null)} />}
    </>
  );
}
