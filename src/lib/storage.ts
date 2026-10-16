/**
 * Storage layer — Supabase when env vars are present, localStorage fallback otherwise.
 * All methods are async so callers (trpc.ts) always await them the same way.
 */
import { supabase } from "./supabaseClient";

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Habit {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface HabitCompletion {
  id: number;
  habitId: number;
  completedDate: string; // YYYY-MM-DD
  completedAt: string;
}

export interface HabitStreak {
  habitId: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

// ── User scope ────────────────────────────────────────────────────────────────

let _userId = "default";

export function setStorageUser(userId: string) {
  _userId = userId;
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToHabit(r: Record<string, any>): Habit {
  return {
    id:           r.id,
    name:         r.name,
    description:  r.description ?? undefined,
    color:        r.color,
    icon:         r.icon,
    displayOrder: r.display_order,
    isActive:     r.is_active,
    createdAt:    r.created_at,
  };
}

function rowToCompletion(r: Record<string, any>): HabitCompletion {
  return {
    id:            r.id,
    habitId:       r.habit_id,
    completedDate: r.completed_date,
    completedAt:   r.completed_at,
  };
}

// ── localStorage fallback ─────────────────────────────────────────────────────

const ls = {
  habitsKey:      () => `habit_tracker_habits_${_userId}`,
  completionsKey: () => `habit_tracker_completions_${_userId}`,

  getHabits(): Habit[] {
    try { return JSON.parse(localStorage.getItem(this.habitsKey()) ?? "[]"); }
    catch { return []; }
  },
  saveHabits(habits: Habit[]) {
    localStorage.setItem(this.habitsKey(), JSON.stringify(habits));
  },
  getCompletions(): HabitCompletion[] {
    try { return JSON.parse(localStorage.getItem(this.completionsKey()) ?? "[]"); }
    catch { return []; }
  },
  saveCompletions(completions: HabitCompletion[]) {
    localStorage.setItem(this.completionsKey(), JSON.stringify(completions));
  },
};

// ── Storage API ───────────────────────────────────────────────────────────────

export const storage = {
  // ── Habits ──────────────────────────────────────────────────────────────────

  async getHabits(): Promise<Habit[]> {
    if (!supabase) return ls.getHabits();
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", _userId)
      .eq("is_active", true)
      .order("display_order");
    if (error) throw error;
    return (data ?? []).map(rowToHabit);
  },

  async createHabit(input: {
    name: string;
    description?: string;
    color: string;
    icon: string;
    displayOrder: number;
  }): Promise<Habit> {
    if (!supabase) {
      const habits = ls.getHabits();
      const habit: Habit = {
        id: Date.now(),
        ...input,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      ls.saveHabits([...habits, habit]);
      return habit;
    }
    const id = Date.now();
    const insertRow: Record<string, unknown> = {
      id,
      user_id:       _userId,
      name:          input.name,
      color:         input.color,
      icon:          input.icon,
      display_order: input.displayOrder,
      is_active:     true,
    };
    if (input.description) insertRow.description = input.description;

    const { data, error } = await supabase
      .from("habits")
      .insert(insertRow)
      .select()
      .single();
    if (error) throw error;
    return rowToHabit(data);
  },

  async updateHabit(
    habitId: number,
    updates: Partial<Omit<Habit, "id" | "createdAt">>
  ): Promise<Habit> {
    if (!supabase) {
      const habits = ls.getHabits();
      const idx = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) throw new Error("Habit not found");
      habits[idx] = { ...habits[idx], ...updates };
      ls.saveHabits(habits);
      return habits[idx];
    }
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name         !== undefined) dbUpdates.name          = updates.name;
    if (updates.description  !== undefined) dbUpdates.description   = updates.description ?? null;
    if (updates.color        !== undefined) dbUpdates.color         = updates.color;
    if (updates.icon         !== undefined) dbUpdates.icon          = updates.icon;
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
    if (updates.isActive     !== undefined) dbUpdates.is_active     = updates.isActive;

    const { data, error } = await supabase
      .from("habits")
      .update(dbUpdates)
      .eq("id", habitId)
      .eq("user_id", _userId)
      .select()
      .single();
    if (error) throw error;
    return rowToHabit(data);
  },

  async deleteHabit(habitId: number): Promise<void> {
    if (!supabase) {
      ls.saveHabits(ls.getHabits().filter((h) => h.id !== habitId));
      ls.saveCompletions(ls.getCompletions().filter((c) => c.habitId !== habitId));
      return;
    }
    // Completions cascade-delete via FK on delete cascade
    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", _userId);
    if (error) throw error;
  },

  async reorderHabits(habitIds: number[]): Promise<void> {
    if (!supabase) {
      const habits = ls.getHabits();
      const reordered = habitIds.map((id, idx) => {
        const h = habits.find((h) => h.id === id);
        return { ...h!, displayOrder: idx };
      });
      ls.saveHabits(reordered);
      return;
    }
    await Promise.all(
      habitIds.map((id, idx) =>
        supabase!
          .from("habits")
          .update({ display_order: idx })
          .eq("id", id)
          .eq("user_id", _userId)
      )
    );
  },

  // ── Completions ──────────────────────────────────────────────────────────────

  async getCompletions(): Promise<HabitCompletion[]> {
    if (!supabase) return ls.getCompletions();
    const { data, error } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", _userId);
    if (error) throw error;
    return (data ?? []).map(rowToCompletion);
  },

  async addCompletion(habitId: number, date: string): Promise<HabitCompletion> {
    if (!supabase) {
      const completions = ls.getCompletions();
      const c: HabitCompletion = {
        id:            Date.now(),
        habitId,
        completedDate: date,
        completedAt:   new Date().toISOString(),
      };
      ls.saveCompletions([...completions, c]);
      return c;
    }
    const { data, error } = await supabase
      .from("habit_completions")
      .insert({
        id:             Date.now(),
        habit_id:       habitId,
        user_id:        _userId,
        completed_date: date,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToCompletion(data);
  },

  async removeCompletion(habitId: number, date: string): Promise<void> {
    if (!supabase) {
      ls.saveCompletions(
        ls.getCompletions().filter(
          (c) => !(c.habitId === habitId && c.completedDate === date)
        )
      );
      return;
    }
    const { error } = await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id",       habitId)
      .eq("user_id",        _userId)
      .eq("completed_date", date);
    if (error) throw error;
  },
};
