import { useQuery } from "@tanstack/react-query";
import { storage, type HabitCompletion } from "../../lib/storage";

/** Shared cache key — single source of truth for every completion in the app. */
export const COMPLETIONS_KEY = ["completions", "all"] as const;

/** All completions for the signed-in user. Components derive streaks/grids from this. */
export function useCompletions() {
  return useQuery<HabitCompletion[]>({
    queryKey: COMPLETIONS_KEY,
    queryFn: () => storage.getCompletions(),
  });
}
