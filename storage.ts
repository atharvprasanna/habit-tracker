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

// userId is set at login so each Google account has its own isolated data
let _userId = "default";

export function setStorageUser(userId: string) {
  _userId = userId;
}

function habitsKey()      { return `habit_tracker_habits_${_userId}`; }
function completionsKey() { return `habit_tracker_completions_${_userId}`; }

export const storage = {
  getHabits: (): Habit[] => {
    const data = localStorage.getItem(habitsKey());
    return data ? JSON.parse(data) : [];
  },
  saveHabits: (habits: Habit[]) => {
    localStorage.setItem(habitsKey(), JSON.stringify(habits));
  },
  getCompletions: (): HabitCompletion[] => {
    const data = localStorage.getItem(completionsKey());
    return data ? JSON.parse(data) : [];
  },
  saveCompletions: (completions: HabitCompletion[]) => {
    localStorage.setItem(completionsKey(), JSON.stringify(completions));
  },
};
