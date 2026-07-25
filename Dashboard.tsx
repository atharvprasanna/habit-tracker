import { Button, Input } from "./ui-shims";
import { useSettings } from "./useSettings";
import { SettingsPanel } from "./SettingsPanel";
import QuoteOfDay from "./QuoteOfDay";
import { useConfetti, getMilestone } from "./Confetti";
import Heatmap from "./Heatmap";
import MonthlySummary from "./MonthlySummary";
import { trpc } from "./trpc";
import { useAuth } from "./useAuth";
import { Flame, Plus, Trash2, ChevronLeft, ChevronRight, Settings, MoreVertical, Edit2, Archive, ChevronUp, ChevronDown, Palette, TrendingUp, CheckCircle2, Target, Sun, Moon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState, useMemo, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { storage } from "./storage";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface HabitGoal {
  [habitId: number]: number;
}

/**
 * Horizontal Calendar Habit Tracker
 * Matches DailyHabits with horizontal date row, checkboxes, and Goal/Achievement columns
 */
export default function Dashboard() {
  const { user } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const { fire: fireConfetti } = useConfetti();
  const utils = trpc.useUtils();
  const [newHabitName, setNewHabitName] = useState("");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habitGoals, setHabitGoals] = useState<HabitGoal>({});
  const [showSettings, setShowSettings] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingHabitName, setEditingHabitName] = useState("");
  const [selectedHabitForColor, setSelectedHabitForColor] = useState<number | null>(null);
  const [selectedGraphHabitId, setSelectedGraphHabitId] = useState<number | null>(null);
  const [heatmapKey, setHeatmapKey] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorOptions = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4"];
  const menuRefs = useRef<{ [key: string | number]: HTMLDivElement | null | { top: number; left: number } }>({});
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  // Fetch all habits
  const { data: habits = [], isLoading } = trpc.habits.list.useQuery();

  // Create habit mutation
  const createMutation = trpc.habits.create.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      setNewHabitName("");
      setIsAddingHabit(false);
      toast.success("Habit added!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create habit");
    },
  });

  // Check in mutation - toggle completion
  const checkInMutation = trpc.checkins.create.useMutation({
    onSuccess: (_data, variables) => {
      utils.checkins.calendar.invalidate();
      setHeatmapKey((k) => k + 1); // refresh heatmap immediately
      utils.habits.list.invalidate().then(() => {
        // Check milestone after habits refresh
        const updatedHabits = utils.habits.list.getData() ?? [];
        const habit = updatedHabits.find((h: any) => h.id === variables.habitId);
        if (habit) {
          const streak = (habit as any).currentStreak ?? 0;
          const milestone = getMilestone(streak);
          if (milestone) {
            fireConfetti();
            toast.success(`${milestone.emoji} ${milestone.message}`, {
              duration: 5000,
              style: { fontWeight: "600", fontSize: "15px" },
            });
          }
        }
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to toggle habit");
    },
  });

  // Delete habit mutation
  const deleteMutation = trpc.habits.delete.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      toast.success("Habit deleted");
      setOpenMenuId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete habit");
    },
  });

  // Edit habit mutation
  const editMutation = trpc.habits.update.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      toast.success("Habit updated");
      setEditingHabitId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update habit");
    },
  });

  // Update color mutation
  const updateColorMutation = trpc.habits.updateColor.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      toast.success("Color updated");
      setOpenMenuId(null);
      setShowColorPicker(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update color");
    },
  });

  // Reorder habits mutation
  const reorderMutation = trpc.habits.reorder.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reorder habits");
    },
  });

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) {
      toast.error("Enter a habit name");
      return;
    }
    createMutation.mutate({
      name: newHabitName,
      color: "#3b82f6",
      icon: "circle",
    });
  };

  const handleCheckIn = (habitId: number, date: string) => {
    checkInMutation.mutate({ habitId, date });
  };

  const getHabitColor = (habitId: number) => {
    const habit = habits?.find(h => h.id === habitId);
    return habit?.color || "#3b82f6";
  };

  const handleDeleteHabit = (habitId: number) => {
    if (window.confirm("Delete this habit?")) {
      deleteMutation.mutate({ habitId });
    }
  };

  const isFirstHabit = (habitId: number) => {
    return habits?.[0]?.id === habitId;
  };

  const isLastHabit = (habitId: number) => {
    return habits?.[habits.length - 1]?.id === habitId;
  };

  const handleEditHabit = (habitId: number, currentName: string) => {
    setEditingHabitId(habitId);
    setEditingHabitName(currentName);
    setOpenMenuId(null);
  };

  const handleSaveEditHabit = (habitId: number) => {
    if (!editingHabitName.trim()) {
      toast.error("Habit name cannot be empty");
      return;
    }
    editMutation.mutate({
      habitId,
      name: editingHabitName,
    });
  };

  const handleShowColorPicker = (habitId: number) => {
    setSelectedHabitForColor(habitId);
    setShowColorPicker(true);
  };

  const handleArchiveHabit = (habitId: number) => {
    toast.info("Archive feature coming soon");
    setOpenMenuId(null);
  };

  const handleUpdateColor = (habitId: number, color: string) => {
    updateColorMutation.mutate({ habitId, color });
  };

  const handleReorderHabit = (direction: 'up' | 'down') => {
    if (!habits || !openMenuId) return;
    const currentIndex = habits.findIndex(h => h.id === openMenuId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= habits.length) return;
    
    // Swap the habits
    const newOrder = [...habits];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    // Send new order to backend
    reorderMutation.mutate({ habitIds: newOrder.map(h => h.id) });
    setOpenMenuId(null);
  };

  // Calculate date range (monthly only)
  const dateRange = useMemo(() => {
    const end = new Date(currentDate);
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    return { start, end };
  }, [currentDate]);

  // Generate calendar dates
  const calendarDates = useMemo(() => {
    const dates = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [dateRange]);

  const startDateStr = dateRange.start.toISOString().split('T')[0];
  const endDateStr = dateRange.end.toISOString().split('T')[0];

  // Fetch calendar data for ALL habits in parallel
  const habitCalendarQueries = useQueries({
    queries: habits.map((habit) => ({
      queryKey: ["checkins", "calendar", habit.id, startDateStr, endDateStr],
      queryFn: async () => {
        const completions = storage.getCompletions();
        const habitCompletions = completions.filter((c) => c.habitId === habit.id);
        const completedDates = new Set(habitCompletions.map((c) => c.completedDate));

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const calendar: { date: string; completed: boolean }[] = [];
        const current = new Date(start);
        while (current <= end) {
          const dateStr = current.toISOString().split("T")[0];
          calendar.push({ date: dateStr, completed: completedDates.has(dateStr) });
          current.setDate(current.getDate() + 1);
        }
        return { habitId: habit.id, calendar };
      },
      enabled: habits.length > 0,
    })),
  });

  // Build completion map from all habits' results
  const completionMap = useMemo(() => {
    const map: Record<number, Record<string, boolean>> = {};
    habits.forEach((habit) => { map[habit.id] = {}; });

    habitCalendarQueries.forEach((query) => {
      if (query.data) {
        query.data.calendar.forEach((item) => {
          map[query.data!.habitId][item.date] = item.completed;
        });
      }
    });

    return map;
  }, [habitCalendarQueries, habits]);

  // Graph data for selected habit
  const graphHabit = habits.find(h => h.id === selectedGraphHabitId) ?? null;

  const graphChartData = useMemo(() => {
    if (!selectedGraphHabitId) return [];
    const todayStr = new Date().toISOString().split("T")[0];
    return calendarDates.map(date => {
      const dateStr = date.toISOString().split("T")[0];
      const isFuture = dateStr > todayStr;
      const completed = !isFuture && (completionMap[selectedGraphHabitId]?.[dateStr] ?? false);
      return {
        date: String(date.getDate()),
        fullDate: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        completed,
        isFuture,
        value: isFuture ? null : (completed ? 1 : 0.35), // null skips bar; 0.35 = missed placeholder
      };
    });
  }, [selectedGraphHabitId, calendarDates, completionMap]);

  const graphStats = useMemo(() => {
    const pastDays = graphChartData.filter(d => !d.isFuture);
    const completedDays = pastDays.filter(d => d.completed).length;
    const totalDays = pastDays.length; // only count days that have passed
    const rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const goal = selectedGraphHabitId ? (habitGoals[selectedGraphHabitId] || 0) : 0;
    return { completedDays, totalDays, rate, goal };
  }, [graphChartData, habitGoals, selectedGraphHabitId]);

  // Check if date is completed for a habit
  const isDateCompleted = (habitId: number, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return completionMap[habitId]?.[dateStr] ?? false;
  };

  // Calculate completion count for a habit
  const getCompletionCount = (habitId: number) => {
    let count = 0;
    calendarDates.forEach((date) => {
      if (isDateCompleted(habitId, date)) {
        count++;
      }
    });
    return count;
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    newDate.setDate(1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    newDate.setDate(1);
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    const startStr = dateRange.start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = dateRange.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card sticky top-0 z-20">
        <div className="max-w-full mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 ht-accent-text" />
            <h1 className="text-2xl font-bold">Habits Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
              className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title={settings.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {settings.theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 py-6">
        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="p-4">
                <SettingsPanel
                  settings={settings}
                  onUpdate={updateSettings}
                  onClose={() => setShowSettings(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold">Welcome, {user?.name?.split(" ")[0] ?? "there"}!</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your habits for {new Date(currentDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-44 text-center">{formatDateHeader()}</span>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quote of the day */}
        <QuoteOfDay />

        {/* Add Habit Form */}
        <div className="mb-8 flex justify-center">
          {!isAddingHabit ? (
            <Button onClick={() => setIsAddingHabit(true)} className="ht-accent-btn text-white font-semibold py-2 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Add New Habit
            </Button>
          ) : (
            <form onSubmit={handleAddHabit} className="flex gap-2">
              <Input
                placeholder="Habit name..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                autoFocus
              />
              <Button type="submit" disabled={createMutation.isPending}>
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingHabit(false)}
              >
                Cancel
              </Button>
            </form>
          )}
        </div>

        {/* Habits Calendar Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No habits yet. Add one to get started!
          </div>
        ) : (
          <div className="border rounded-2xl bg-card overflow-visible">
            <div className="overflow-x-auto overflow-y-visible" style={{ overscrollBehavior: 'contain' }}>
            <table className="w-full text-sm border-collapse overflow-visible">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-3 text-left font-semibold text-sm min-w-40 sticky left-0 bg-card z-10">
                    Habit
                  </th>
                  {calendarDates.map((date, idx) => (
                    <th
                      key={idx}
                      className="px-2 py-3 text-center font-semibold text-xs min-w-12 border-l"
                    >
                      <div className="font-bold">{date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}</div>
                      <div className="text-xs text-muted-foreground">{date.getDate()}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-sm border-l w-24 min-w-24 bg-blue-50 dark:bg-blue-950 sticky right-28 z-10">
                    Goal
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-sm border-l w-28 min-w-28 bg-green-50 dark:bg-green-950 sticky right-0 z-10">
                    Achievement
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => {
                  const completionCount = getCompletionCount(habit.id);
                  const goal = habitGoals[habit.id] || 0;
                  
                  return (
                    <tr key={habit.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-sm sticky left-0 z-10 flex items-center justify-between border-r" style={{ backgroundColor: habit.color || "#3b82f6", color: "white" }}>
                        <div className="flex-1">
                          {editingHabitId === habit.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingHabitName}
                                onChange={(e) => setEditingHabitName(e.target.value)}
                                autoFocus
                                className="h-8"
                              />
                              <Button size="sm" onClick={() => handleSaveEditHabit(habit.id)} disabled={editMutation.isPending}>Save</Button>
                            </div>
                          ) : (
                            <div>{habit.name}</div>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              // Calculate position with offset to ensure visibility below button
                              let top = rect.bottom + 4;
                              let left = rect.right - 160;
                              
                              // Ensure dropdown doesn't go off-screen on the right
                              if (left < 0) left = 4;
                              
                              // Ensure dropdown doesn't go off-screen on the bottom (adjust to show above if needed)
                              const dropdownHeight = 120; // Approximate height of dropdown
                              if (top + dropdownHeight > window.innerHeight) {
                                top = rect.top - dropdownHeight - 4;
                              }
                              
                              (menuRefs.current as any)[`pos-${habit.id}`] = { top, left };
                              setOpenMenuId(openMenuId === habit.id ? null : habit.id);
                            }}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === habit.id ? createPortal(
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div
                                ref={(el) => { menuRefs.current[habit.id] = el; }}
                                className="fixed bg-background border rounded-2xl shadow-2xl z-50 min-w-40 overflow-hidden"
                                style={{
                                  top: `${((menuRefs.current as any)[`pos-${habit.id}`] as any)?.top ?? 0}px`,
                                  left: `${((menuRefs.current as any)[`pos-${habit.id}`] as any)?.left ?? 0}px`,
                                }}
                              >
                              <button
                                onClick={() => handleEditHabit(habit.id, habit.name)}
                                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleShowColorPicker(habit.id)}
                                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm border-t"
                              >
                                <Palette className="w-4 h-4" />
                                Color
                              </button>
                              {!isFirstHabit(habit.id) && (
                                <button
                                  onClick={() => handleReorderHabit('up')}
                                  className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm border-t"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                  Move Up
                                </button>
                              )}
                              {!isLastHabit(habit.id) && (
                                <button
                                  onClick={() => handleReorderHabit('down')}
                                  className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                  Move Down
                                </button>
                              )}
                              <button
                                onClick={() => handleArchiveHabit(habit.id)}
                                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm border-t"
                              >
                                <Archive className="w-4 h-4" />
                                Archive
                              </button>
                              <button
                                onClick={() => handleDeleteHabit(habit.id)}
                                className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 text-sm border-t text-red-600"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                            </>,
                            document.body
                          ) : null}
                        </div>
                      </td>
                      {calendarDates.map((date, idx) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const isCompleted = isDateCompleted(habit.id, date);
                        const isToday = new Date().toISOString().split("T")[0] === dateStr;
                        const isFutureDate = date > new Date();

                        return (
                          <td
                            key={idx}
                            className={`px-2 py-3 text-center border-l cursor-pointer hover:bg-muted/50 transition-colors ${isToday ? "bg-blue-100 dark:bg-blue-900" : ""} ${isFutureDate ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => !isFutureDate && handleCheckIn(habit.id, dateStr)}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted && !isFutureDate}
                              onChange={() => !isFutureDate && handleCheckIn(habit.id, dateStr)}
                              className="w-5 h-5 cursor-pointer accent-green-500"
                              title={date.toLocaleDateString()}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isFutureDate}
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center border-l bg-blue-50 dark:bg-blue-950 sticky right-28 z-10 w-24 min-w-24">
                        <input
                          type="number"
                          min="0"
                          max={calendarDates.length}
                          value={goal}
                          onChange={(e) => {
                            const val = Math.min(parseInt(e.target.value) || 0, calendarDates.length);
                            setHabitGoals({ ...habitGoals, [habit.id]: val });
                          }}
                          className="w-14 px-2 py-1 border rounded-xl text-center bg-background text-foreground"
                          placeholder="0"
                          title={`Max: ${calendarDates.length} days`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center border-l font-semibold bg-green-50 dark:bg-green-950 sticky right-0 z-10 w-28 min-w-28">
                        <div className="flex items-center justify-center gap-2">
                          <span>{completionCount}</span>
                          {goal > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({Math.round((completionCount / goal) * 100)}%)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
        
        {/* Progress Graph Section */}
        {habits.length > 0 && (
          <div className="mt-6 border rounded-2xl bg-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Progress
              </h2>
              <select
                value={selectedGraphHabitId ?? ""}
                onChange={(e) => setSelectedGraphHabitId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border rounded-lg bg-background text-foreground text-sm"
              >
                <option value="">Select a habit…</option>
                {habits.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {selectedGraphHabitId && graphHabit && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {/* Streak card */}
                  <div className="rounded-lg p-3.5 border-l-4 border border-amber-400 bg-amber-50 dark:bg-amber-950/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Streak</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {(graphHabit as any).currentStreak ?? 0}
                      </span>
                      <span className="text-xs text-amber-500 font-medium">days</span>
                    </div>
                    <div className="mt-1 text-xs text-amber-600/70 dark:text-amber-500/70">
                      Best: {(graphHabit as any).longestStreak ?? 0} days
                    </div>
                  </div>

                  {/* Completion rate card */}
                  <div className="rounded-lg p-3.5 border-l-4 border border-green-400 bg-green-50 dark:bg-green-950/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Rate</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                        {graphStats.rate}
                      </span>
                      <span className="text-sm text-green-500 font-medium">%</span>
                    </div>
                    <div className="mt-1.5">
                      <div className="w-full h-1 bg-green-100 dark:bg-green-900/50 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${graphStats.rate}%` }} />
                      </div>
                      <div className="text-xs text-green-600/70 dark:text-green-500/70 mt-1">
                        {graphStats.completedDays} of {graphStats.totalDays} days
                      </div>
                    </div>
                  </div>

                  {/* Goal card */}
                  <div className="rounded-lg p-3.5 border-l-4 border border-blue-400 bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Goal</span>
                    </div>
                    {graphStats.goal > 0 ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                            {graphStats.completedDays}
                          </span>
                          <span className="text-xs text-blue-400 font-medium">/ {graphStats.goal}</span>
                        </div>
                        <div className="mt-1.5">
                          <div className="w-full h-1 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(Math.round((graphStats.completedDays / graphStats.goal) * 100), 100)}%` }} />
                          </div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-1">
                            {Math.min(Math.round((graphStats.completedDays / graphStats.goal) * 100), 100)}% of goal
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                          {graphStats.completedDays}
                        </div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-1">Set a goal in the table ↑</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bar chart */}
                <div className="text-xs text-muted-foreground mb-3">{formatDateHeader()}</div>
                <div className="overflow-x-auto">
                <div style={{ minWidth: Math.max(graphChartData.length * 28, 400) }}>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={graphChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barCategoryGap="20%">
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        if (d.isFuture) return null;
                        return (
                          <div className="bg-background border rounded-lg px-3 py-2 text-xs shadow-md">
                            <div className="font-medium mb-0.5">{d.fullDate}</div>
                            <div className={d.completed ? "text-green-500" : "text-muted-foreground"}>
                              {d.completed ? "✓ Completed" : "✗ Missed"}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} minPointSize={2} isAnimationActive={false}>
                      {graphChartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.completed ? (graphHabit.color || "#3b82f6") : "#e5e7eb"}
                          opacity={entry.isFuture ? 0 : entry.completed ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: graphHabit.color || "#3b82f6" }} />
                    Completed
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-sm bg-muted border" />
                    Missed
                  </div>
                </div>
              </>
            )}

            {!selectedGraphHabitId && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Select a habit above to see your progress chart
              </div>
            )}
          </div>
        )}

        {/* Monthly Summary */}
        {habits.length > 0 && (
          <MonthlySummary habits={habits as any} currentDate={currentDate} />
        )}

        {/* Heatmap */}
        {habits.length > 0 && (
          <Heatmap habits={habits.map(h => ({ id: h.id, name: h.name, color: h.color || "#f97316" }))} refreshKey={heatmapKey} />
        )}

        {/* Color Picker Modal */}
        {showColorPicker && selectedHabitForColor && createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowColorPicker(false)}
            />
            <div
              ref={colorPickerRef}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border rounded-lg shadow-2xl z-50 p-6 w-80"
            >
              <h3 className="text-lg font-semibold mb-4">Choose Color</h3>
              <div className="grid grid-cols-5 gap-3 mb-4">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      handleUpdateColor(selectedHabitForColor, color);
                    }}
                    className="w-12 h-12 rounded-lg border-2 hover:border-foreground transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: getHabitColor(selectedHabitForColor) === color ? '#000' : 'transparent',
                    }}
                    title={color}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowColorPicker(false)}
              >
                Cancel
              </Button>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
}
