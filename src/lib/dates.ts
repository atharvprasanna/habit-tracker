/**
 * Date keys are LOCAL calendar dates formatted YYYY-MM-DD.
 *
 * Never build a key with `date.toISOString()`: that converts to UTC, so for anyone east of
 * UTC (e.g. India) local midnight lands on the previous day and check-ins get saved a day early.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date of `d` as YYYY-MM-DD. */
export function toDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local date key. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Local-midnight Date for a YYYY-MM-DD key. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from key `a` to key `b` (b - a). Timezone/DST safe. */
export function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}
