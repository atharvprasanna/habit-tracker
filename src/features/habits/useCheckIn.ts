import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storage, type HabitCompletion } from "../../lib/storage";
import { calculateStreak } from "../../lib/trpc";
import { COMPLETIONS_KEY } from "./useCompletions";

export interface CheckInResult {
  habitId: number;
  /** true = ticked, false = un-ticked */
  checked: boolean;
  prevStreak: number;
  newStreak: number;
}

interface Vars {
  habitId: number;
  date: string;
  add: boolean;
}

interface Ctx {
  previous: HabitCompletion[] | undefined;
}

const MUTATION_KEY = ["checkin"];

/**
 * Optimistic check-in toggle.
 * The UI updates immediately from the shared completions cache; Supabase is written in
 * the background (serialised so rapid taps stay in order) and rolled back on failure.
 */
export function useCheckIn(onToggled?: (result: CheckInResult) => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, Vars, Ctx>({
    mutationKey: MUTATION_KEY,
    scope: { id: "checkin" }, // run one write at a time, in click order
    mutationFn: async ({ habitId, date, add }) => {
      if (add) {
        try {
          await storage.addCompletion(habitId, date);
        } catch (e: any) {
          if (e?.code === "23505") return; // already exists in DB — treat as success
          throw e;
        }
      } else {
        await storage.removeCompletion(habitId, date);
      }
    },
    onMutate: async ({ habitId, date, add }) => {
      await queryClient.cancelQueries({ queryKey: COMPLETIONS_KEY });
      const previous = queryClient.getQueryData<HabitCompletion[]>(COMPLETIONS_KEY);
      const list = previous ?? [];

      const next = add
        ? [
            ...list,
            {
              id: -Date.now(), // temporary id, replaced when the cache re-syncs
              habitId,
              completedDate: date,
              completedAt: new Date().toISOString(),
            },
          ]
        : list.filter((c) => !(c.habitId === habitId && c.completedDate === date));

      queryClient.setQueryData(COMPLETIONS_KEY, next);

      onToggled?.({
        habitId,
        checked: add,
        prevStreak: calculateStreak(habitId, list).currentStreak,
        newStreak: calculateStreak(habitId, next).currentStreak,
      });

      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(COMPLETIONS_KEY, ctx.previous);
      toast.error(error.message || "Couldn't save — check your connection");
    },
    onSettled: () => {
      // Re-sync with the server only once the last queued write has finished
      if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) === 1) {
        queryClient.invalidateQueries({ queryKey: COMPLETIONS_KEY });
        queryClient.invalidateQueries({ queryKey: ["checkins", "calendar"] });
        queryClient.invalidateQueries({ queryKey: ["habits", "get"] });
      }
    },
  });

  const { mutate } = mutation;

  /** Flip a habit's state for a date. Ignored until completions have loaded. */
  const toggle = useCallback(
    (habitId: number, date: string) => {
      const list = queryClient.getQueryData<HabitCompletion[]>(COMPLETIONS_KEY);
      if (!list) return;
      const exists = list.some((c) => c.habitId === habitId && c.completedDate === date);
      mutate({ habitId, date, add: !exists });
    },
    [queryClient, mutate]
  );

  return { toggle };
}
