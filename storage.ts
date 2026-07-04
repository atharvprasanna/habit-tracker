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

const HABITS_KEY = "habit_tracker_habits";
const COMPLETIONS_KEY = "habit_tracker_completions";

export const storage = {
  getHabits: (): Habit[] => {
    const data = localStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveHabits: (habits: Habit[]) => {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  },
  getCompletions: (): HabitCompletion[] => {
    const data = localStorage.getItem(COMPLETIONS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveCompletions: (completions: HabitCompletion[]) => {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
  },
};
