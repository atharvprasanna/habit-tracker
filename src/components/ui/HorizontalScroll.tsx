import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
  /** Called on every horizontal scroll with the current scrollLeft */
  onScrollX?: (scrollLeft: number) => void;
}

/**
 * Horizontally scrollable area with a phone-only "swipe" hint underneath.
 * The hint shows whenever the content overflows AND the user is at the start;
 * it hides while scrolled and comes back when they return to the start.
 */
const HorizontalScroll = forwardRef<HTMLDivElement, Props>(function HorizontalScroll(
  { children, label = "Swipe to view more", accentColor, className = "", style, onScrollX },
  forwardedRef
) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [overflowing, setOverflowing] = useState(false);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  // Track whether the content is wider than the visible area (also on resize / data changes)
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollWidth - el.clientWidth > 8);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [children]);

  return (
    <>
      <div
        ref={setRefs}
        className={`overflow-x-auto ${className}`}
        style={style}
        onScroll={(e) => {
          const left = e.currentTarget.scrollLeft;
          setAtStart(left <= 8);
          onScrollX?.(left);
        }}
      >
        {children}
      </div>
      {overflowing && atStart && (
        <div className="pointer-events-none flex items-center justify-center gap-2 border-t bg-muted/40 py-2 text-xs font-medium text-muted-foreground md:hidden">
          <span>{label}</span>
          <ArrowRight className="ht-nudge h-4 w-4" style={{ color: accentColor }} />
        </div>
      )}
    </>
  );
});

export default HorizontalScroll;
