import { storage, Habit, HabitCompletion } from "./storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Streak calculation logic
function calculateStreak(habitId: number, completions: HabitCompletion[]) {
  const habitCompletions = completions
    .filter((c) => c.habitId === habitId)
    .sort((a, b) => a.completedDate.localeCompare(b.completedDate));

  if (habitCompletions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  }

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < habitCompletions.length; i++) {
    const prevDate = new Date(habitCompletions[i - 1].completedDate);
    const currDate = new Date(habitCompletions[i].completedDate);
    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (daysDiff > 1) {
      currentStreak = 1;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastCompletion = new Date(habitCompletions[habitCompletions.length - 1].completedDate);
  const daysSinceLastCompletion = Math.floor((today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24));

  const activeCurrentStreak = daysSinceLastCompletion <= 1 ? currentStreak : 0;

  return {
    currentStreak: activeCurrentStreak,
    longestStreak,
    lastCompletedDate: habitCompletions[habitCompletions.length - 1].completedDate,
  };
}

export const trpc = {
  useUtils: () => {
    const queryClient = useQueryClient();
    return {
      habits: {
        list: {
          invalidate: () => queryClient.invalidateQueries({ queryKey: ["habits", "list"] }),
        },
        get: {
          invalidate: (input?: { habitId: number }) => 
            queryClient.invalidateQueries({ queryKey: input?.habitId ? ["habits", "get", input.habitId] : ["habits", "get"] }),
        },
      },
      checkins: {
        calendar: {
          invalidate: (input?: { habitId: number }) =>
            queryClient.invalidateQueries({ queryKey: input?.habitId ? ["checkins", "calendar", input.habitId] : ["checkins", "calendar"] }),
        }
      },
      auth: {
        me: {
          setData: () => {},
          invalidate: () => {},
        }
      }
    };
  },
  auth: {
    me: {
      useQuery: () => ({
        data: { id: 1, name: "Local User" },
        isLoading: false,
        error: null,
      }),
    },
    logout: {
      useMutation: () => ({
        mutateAsync: () => Promise.resolve(),
        isPending: false,
        error: null,
      }),
    },
  },
  habits: {
    list: {
      useQuery: () => useQuery({
        queryKey: ["habits", "list"],
        queryFn: async () => {
          const habits = storage.getHabits();
          const completions = storage.getCompletions();
          return habits.map((h) => {
            const streak = calculateStreak(h.id, completions);
            return { ...h, ...streak };
          });
        },
      }),
    },
    get: {
      useQuery: (input: { habitId: number }) => useQuery({
        queryKey: ["habits", "get", input.habitId],
        queryFn: async () => {
          const habits = storage.getHabits();
          const habit = habits.find((h) => h.id === input.habitId);
          if (!habit) throw new Error("Habit not found");
          
          const completions = storage.getCompletions();
          const streak = calculateStreak(habit.id, completions);
          const habitCompletions = completions
            .filter((c) => c.habitId === habit.id)
            .map((c) => c.completedDate);

          return { ...habit, ...streak, completions: habitCompletions };
        },
      }),
    },
    create: {
      useMutation: (options: any) => useMutation({
        mutationFn: async (input: any) => {
          const habits = storage.getHabits();
          const newHabit: Habit = {
            id: Date.now(),
            name: input.name,
            description: input.description,
            color: input.color || "#3b82f6",
            icon: input.icon || "circle",
            displayOrder: habits.length,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          storage.saveHabits([...habits, newHabit]);
          return newHabit;
        },
        ...options,
      }),
    },
    update: {
      useMutation: (options: any) => useMutation({
        mutationFn: async (input: any) => {
          const habits = storage.getHabits();
          const index = habits.findIndex((h) => h.id === (input.habitId || input.id));
          if (index === -1) throw new Error("Habit not found");
          
          habits[index] = { ...habits[index], ...input };
          storage.saveHabits(habits);
          return habits[index];
        },
        ...options,
      }),
    },
    updateColor: {
      useMutation: (options: any) => useMutation({
        mutationFn: async (input: { habitId: number; color: string }) => {
          const habits = storage.getHabits();
          const index = habits.findIndex((h) => h.id === input.habitId);
          if (index === -1) throw new Error("Habit not found");
          
          habits[index] = { ...habits[index], color: input.color };
          storage.saveHabits(habits);
          return habits[index];
        },
        ...options,
      }),
    },
    delete: {
      useMutation: (options: any) => useMutation({
        mutationFn: async (input: { habitId: number }) => {
          const habits = storage.getHabits();
          storage.saveHabits(habits.filter((h) => h.id !== input.habitId));
          const completions = storage.getCompletions();
          storage.saveCompletions(completions.filter((c) => c.habitId !== input.habitId));
          return { success: true };
        },
        ...options,
      }),
    },
    reorder: {
      useMutation: (options: any) => useMutation({
        mutationFn: async (input: { habitIds: number[] }) => {
          const habits = storage.getHabits();
          const reordered = input.habitIds.map((id, index) => {
            const habit = habits.find((h) => h.id === id);
            return { ...habit!, displayOrder: index };
          });
          storage.saveHabits(reordered);
          return { success: true };
        },
        ...options,
      }),
    },
  },
  checkins: {
    create: {
      useMutation: (options: any) => useMutation({
        mutationFn: async (input: { habitId: number; date: string }) => {
          const completions = storage.getCompletions();
          const existingIndex = completions.findIndex(
            (c) => c.habitId === input.habitId && c.completedDate === input.date
          );

          if (existingIndex > -1) {
            completions.splice(existingIndex, 1);
          } else {
            completions.push({
              id: Date.now(),
              habitId: input.habitId,
              completedDate: input.date,
              completedAt: new Date().toISOString(),
            });
          }
          storage.saveCompletions(completions);
          const streak = calculateStreak(input.habitId, completions);
          return { toggled: true, ...streak };
        },
        ...options,
      }),
    },
    calendar: {
      useQuery: (input: { habitId: number; days?: number; startDate?: string; endDate?: string }) => useQuery({
        queryKey: ["checkins", "calendar", input.habitId, input.days, input.startDate, input.endDate],
        queryFn: async () => {
          const completions = storage.getCompletions();
          const habitCompletions = completions.filter((c) => c.habitId === input.habitId);
          
          const endDate = input.endDate ? new Date(input.endDate) : new Date();
          const startDate = input.startDate ? new Date(input.startDate) : new Date();
          if (!input.startDate) startDate.setDate(endDate.getDate() - (input.days || 30));
          
          endDate.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);

          const completedDates = new Set(habitCompletions.map((c) => c.completedDate));
          const calendar = [];
          const current = new Date(startDate);
          while (current <= endDate) {
            const dateStr = current.toISOString().split("T")[0];
            calendar.push({ date: dateStr, completed: completedDates.has(dateStr) });
            current.setDate(current.getDate() + 1);
          }

          const streak = calculateStreak(input.habitId, completions);
          return {
            calendar,
            ...streak,
            completionCount: habitCompletions.length,
          };
        },
      }),
    },
  },
};
