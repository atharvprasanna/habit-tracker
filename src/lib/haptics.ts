/** Short vibration feedback on supported phones (no-op elsewhere, e.g. iOS Safari / desktop). */
export function vibrate(pattern: number | number[] = 10) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* vibration unavailable */
  }
}

export const HAPTIC_CHECK = 12;
export const HAPTIC_MILESTONE = [20, 50, 20, 50, 80];
