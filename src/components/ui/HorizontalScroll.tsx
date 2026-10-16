import { forwardRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  children: ReactNode;
  /** localStorage key; once the user scrolls sideways the hint never shows again */
  storageKey: string;
  label?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Horizontally scrollable area with a phone-only "swipe" hint underneath.
 * The hint (text + nudging arrow) disappears the first time the user scrolls sideways.
 */
const HorizontalScroll = forwardRef<HTMLDivElement, Props>(function HorizontalScroll(
  { children, storageKey, label = "Swipe to view more", accentColor, className = "", style },
  ref
) {
  const [seen, setSeen] = useState<boolean>(() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  });

  const dismiss = () => {
    setSeen(true);
    try { localStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
  };

  return (
    <>
      <div
        ref={ref}
        className={`overflow-x-auto ${className}`}
        style={style}
        onScroll={(e) => { if (!seen && e.currentTarget.scrollLeft > 16) dismiss(); }}
      >
        {children}
      </div>
      {!seen && (
        <div className="pointer-events-none flex items-center justify-center gap-2 border-t bg-muted/40 py-2 text-xs font-medium text-muted-foreground md:hidden">
          <span>{label}</span>
          <ArrowRight className="ht-nudge h-4 w-4" style={{ color: accentColor }} />
        </div>
      )}
    </>
  );
});

export default HorizontalScroll;
