import { Button, Input } from "./ui-shims";
import { useSettings } from "./useSettings";
import { SettingsPanel } from "./SettingsPanel";
import QuoteOfDay from "./QuoteOfDay";
import { useConfetti, getCrossedMilestone } from "./Confetti";
import { playCheckInSound, playCelebrationSound } from "./sounds";
import Heatmap from "./Heatmap";
import MonthlySummary from "./MonthlySummary";
import { trpc } from "./trpc";
import { useAuth } from "./useAuth";
import { Flame, Plus, Trash2, ChevronLeft, ChevronRight, Settings, MoreVertical, Edit2, Archive, ChevronUp, ChevronDown, Palette, TrendingUp, CheckCircle2, Target, Sun, Moon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState, useMemo, useRef, useEffect } from "react";
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
  const { settings, update } = useSettings();
  const { fire: fireConfetti } = useConfetti();
  const utils = trpc.useUtils();
  const [newHabitName, setNewHabitName] = useState("");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habitGoals, setHabitGoals] = useState<HabitGoal>(() => {
    try {
      const saved = localStorage.getItem("habit-tracker-goals");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingHabitName, setEditingHabitName] = useState("");
  const [selectedHabitForColor, setSelectedHabitForColor] = useState<number | null>(null);
  const [selectedGraphHabitId, setSelectedGraphHabitId] = useState<number | null>(null);
  const [heatmapKey, setHeatmapKey] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorOptions = [
    // Row 1 — Reds/Pinks
    "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308",
    // Row 2 — Greens
    "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
    // Row 3 — Blues/Indigo
    "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
    // Row 4 — Pink/Purple/Neutral
    "#d946ef", "#ec4899", "#f472b6", "#64748b", "#1e293b",
  ];
  const menuRefs = useRef<{ [key: string | number]: HTMLDivElement | null | { top: number; left: number } }>({});
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  // Forward vertical wheel events to the nearest scrollable ancestor.
  // Attached to document so it survives habit list re-renders.
  useEffect(() => {
    function findScrollableParent(node: Element | null): Element | null {
      while (node && node !== document.body) {
        const { overflowY, overflow } = window.getComputedStyle(node);
        if (/auto|scroll/.test(overflowY + overflow) && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
      return null; // fall back to window
    }

    const onWheel = (e: WheelEvent) => {
      const el = tableScrollRef.current;
      if (!el || !el.contains(e.target as Node)) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // horizontal — let table handle it
      e.preventDefault();
      const scrollable = findScrollableParent(el.parentElement);
      if (scrollable) {
        scrollable.scrollTop += e.deltaY;
      } else {
        window.scrollBy({ top: e.deltaY, behavior: "auto" });
      }
    };

    document.addEventListener("wheel", onWheel, { passive: false });
    return () => document.removeEventListener("wheel", onWheel);
  }, []);

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
    onSuccess: (data) => {
      utils.checkins.calendar.invalidate();
      utils.habits.list.invalidate();
      setHeatmapKey((k) => k + 1);
      // Only celebrate when checking IN (not when unchecking)
      if (!(data as any).checked) return;
      const prevStreak = (data as any).previousStreak ?? 0;
      const newStreak = (data as any).currentStreak ?? 0;
      // Check milestone first so we play only ONE sound (celebration overrides check-in)
      const milestone =
        newStreak > prevStreak ? getCrossedMilestone(prevStreak, newStreak) : null;
      if (milestone) {
        fireConfetti();
        if (settings.soundEnabled) playCelebrationSound(); // replaces check-in sound
        toast.success(`${milestone.emoji} ${milestone.message}`, {
          duration: 5000,
          style: { fontWeight: "600", fontSize: "15px" },
        });
      } else {
        // Regular check-in — play the soft tick
        if (settings.soundEnabled) playCheckInSound();
      }
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
    // Auto-pick a color: prefer one not already used, otherwise cycle by index
    const usedColors = new Set(habits.map((h) => h.color));
    const autoColor =
      colorOptions.find((c) => !usedColors.has(c)) ??
      colorOptions[habits.length % colorOptions.length];
    createMutation.mutate({
      name: newHabitName,
      color: autoColor,
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
            <Flame className="w-8 h-8" style={{ color: "#f97316" }} />
            <h1 className="text-2xl font-bold">Habits Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update({ theme: settings.theme === "dark" ? "light" : "dark" })}
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
                  onUpdate={update}
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
        <div className="mb-8 flex items-center">
          {/* Left spacer — pushes Add button to center */}
          <div className="flex-1" />

          {/* Center: Add / form */}
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
              <Button type="submit" disabled={createMutation.isPending}>Add</Button>
              <Button type="button" variant="outline" onClick={() => setIsAddingHabit(false)}>Cancel</Button>
            </form>
          )}

          {/* Right spacer — contains sound toggle flush to the right */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => update({ soundEnabled: !settings.soundEnabled })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all hover:opacity-75 select-none"
              style={{
                borderColor: settings.soundEnabled ? "#f97316" : undefined,
                color: settings.soundEnabled ? "#f97316" : undefined,
                background: settings.soundEnabled ? "rgba(249,115,22,0.08)" : undefined,
              }}
            >
              {/* Toggle pill */}
              <span
                className="relative inline-flex items-center w-8 h-4 rounded-full transition-colors"
                style={{ background: settings.soundEnabled ? "#f97316" : "#d1d5db" }}
              >
                <span
                  className="absolute w-3 h-3 bg-white rounded-full shadow transition-transform"
                  style={{ transform: settings.soundEnabled ? "translateX(17px)" : "translateX(2px)" }}
                />
              </span>
              {settings.soundEnabled ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              )}
              Sound
            </button>
          </div>
        </div>

        {/* Habits Calendar Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No habits yet. Add one to get started!
          </div>
        ) : (
          <div className="border rounded-2xl bg-card overflow-hidden">
            <div ref={tableScrollRef} className="overflow-x-auto" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-3 text-left font-semibold text-sm min-w-40 sticky left-0 bg-card z-10" style={{ willChange: 'transform' }}>
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
                  <th className="px-4 py-3 text-center font-semibold text-sm border-l w-24 min-w-24 bg-blue-50 dark:bg-blue-950 sticky right-28 z-10" style={{ willChange: 'transform' }}>
                    Goal
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-sm border-l w-28 min-w-28 bg-green-50 dark:bg-green-950 sticky right-0 z-10" style={{ willChange: 'transform' }}>
                    Achievement
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => {
                  const completionCount = getCompletionCount(habit.id);
                  const goal = habitGoals[habit.id] || 0;
                  const hasColor = !!habit.color;

                  return (
                    <tr key={habit.id} className="border-b hover:bg-muted/30">
                      {/* Habit name cell */}
                      <td
                        className="px-4 py-3 font-semibold sticky left-0 z-10 flex items-center justify-between border-r"
                        style={{ willChange: 'transform', ...(hasColor ? { backgroundColor: habit.color, color: "white" } : undefined) }}
                      >
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          {hasColor && (
                            <span className="inline-block w-2 h-2 rounded-full bg-white/50 shrink-0" />
                          )}
                          <span className="text-[15px]">{habit.name}</span>
                        </div>
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              let top = rect.bottom + 4;
                              let left = rect.right - 160;
                              if (left < 0) left = 4;
                              if (top + 160 > window.innerHeight) top = rect.top - 164;
                              (menuRefs.current as any)[`pos-${habit.id}`] = { top, left };
                              setOpenMenuId(openMenuId === habit.id ? null : habit.id);
                            }}
                            className={`p-1 rounded hover:bg-black/10 ${hasColor ? "text-white/80" : "text-muted-foreground"}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === habit.id ? createPortal(
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                              <div
                                ref={(el) => { menuRefs.current[habit.id] = el; }}
                                className="fixed bg-background border rounded-2xl shadow-2xl z-50 min-w-40 overflow-hidden"
                                style={{
                                  top: `${((menuRefs.current as any)[`pos-${habit.id}`] as any)?.top ?? 0}px`,
                                  left: `${((menuRefs.current as any)[`pos-${habit.id}`] as any)?.left ?? 0}px`,
                                }}
                              >
                                <button onClick={() => handleEditHabit(habit.id, habit.name)} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm">
                                  <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={() => handleShowColorPicker(habit.id)} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm border-t">
                                  <Palette className="w-4 h-4" /> Color
                                </button>
                                {!isFirstHabit(habit.id) && (
                                  <button onClick={() => handleReorderHabit('up')} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm border-t">
                                    <ChevronUp className="w-4 h-4" /> Move Up
                                  </button>
                                )}
                                {!isLastHabit(habit.id) && (
                                  <button onClick={() => handleReorderHabit('down')} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm">
                                    <ChevronDown className="w-4 h-4" /> Move Down
                                  </button>
                                )}
                                <button onClick={() => handleArchiveHabit(habit.id)} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm border-t">
                                  <Archive className="w-4 h-4" /> Archive
                                </button>
                                <button onClick={() => handleDeleteHabit(habit.id)} className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 text-sm border-t text-red-600" disabled={deleteMutation.isPending}>
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            </>,
                            document.body
                          ) : null}
                        </div>
                      </td>

                      {/* Calendar cells */}
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
                              className="w-5 h-5 cursor-pointer"
                              style={{ '--cb-color': habit.color || settings.accentColor } as React.CSSProperties}
                              title={date.toLocaleDateString()}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isFutureDate}
                            />
                          </td>
                        );
                      })}

                      {/* Goal */}
                      <td className="px-4 py-3 text-center border-l bg-blue-50 dark:bg-blue-950 sticky right-28 z-10 w-24 min-w-24" style={{ willChange: 'transform' }}>
                        <input
                          type="number"
                          min="0"
                          max={calendarDates.length}
                          value={goal}
                          onChange={(e) => {
                            const val = Math.min(parseInt(e.target.value) || 0, calendarDates.length);
                            const updated = { ...habitGoals, [habit.id]: val };
                            setHabitGoals(updated);
                            localStorage.setItem("habit-tracker-goals", JSON.stringify(updated));
                          }}
                          className="w-14 px-2 py-1 border rounded-xl text-center bg-background text-foreground"
                          placeholder="0"
                          title={`Max: ${calendarDates.length} days`}
                        />
                      </td>

                      {/* Achievement */}
                      <td className="px-4 py-3 text-center border-l font-semibold bg-green-50 dark:bg-green-950 sticky right-0 z-10 w-28 min-w-28" style={{ willChange: 'transform' }}>
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
        
        {/* Monthly Summary — above Progress */}
        {habits.length > 0 && (
          <MonthlySummary habits={habits as any} currentDate={currentDate} />
        )}

        {/* Progress Graph Section */}
        {habits.length > 0 && (
          <div className="mt-6 border rounded-2xl bg-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Habit Details
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
                {/* Month in Review label */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Month in Review</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

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
                Select a habit above to see your progress &amp; yearly review
              </div>
            )}
          </div>
        )}

        {/* Year in Review — only shown after a habit is selected */}
        {habits.length > 0 && selectedGraphHabitId && (
          <div className="mt-6 border rounded-2xl bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">📅</span>
              <h2 className="text-base font-semibold">Year in Review</h2>
              {graphHabit && (
                <span className="text-sm text-muted-foreground ml-1">— {graphHabit.name}</span>
              )}
            </div>
            <Heatmap
              habits={habits.map(h => ({ id: h.id, name: h.name, color: h.color || "#f97316" }))}
              habitId={selectedGraphHabitId ?? undefined}
              refreshKey={heatmapKey}
            />
          </div>
        )}

        {/* Edit Habit Dialog */}
        {editingHabitId !== null && createPortal(
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setEditingHabitId(null)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border rounded-2xl shadow-2xl z-50 p-6 w-80">
              <h3 className="text-lg font-semibold mb-1">Edit Habit</h3>
              <p className="text-sm text-muted-foreground mb-4">Rename this habit</p>
              <Input
                value={editingHabitName}
                onChange={(e) => setEditingHabitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEditHabit(editingHabitId);
                  if (e.key === "Escape") setEditingHabitId(null);
                }}
                autoFocus
                className="mb-4"
                placeholder="Habit name…"
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1 ht-accent-btn text-white"
                  onClick={() => handleSaveEditHabit(editingHabitId)}
                  disabled={editMutation.isPending}
                >
                  Save
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditingHabitId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </>,
          document.body
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
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border rounded-2xl shadow-2xl z-50 p-6 w-72"
            >
              <h3 className="text-base font-semibold mb-1">Choose Colour</h3>
              <p className="text-xs text-muted-foreground mb-4">Pick a colour for this habit</p>
              <div className="grid grid-cols-5 gap-2.5 mb-5">
                {/* Clear / no-colour option */}
                <button
                  onClick={() => handleUpdateColor(selectedHabitForColor, "")}
                  className="relative w-10 h-10 rounded-xl border-2 border-dashed border-muted-foreground/40 hover:border-muted-foreground transition-all flex items-center justify-center text-muted-foreground hover:scale-110"
                  title="No colour"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                {colorOptions.map((color) => {
                  const isSelected = getHabitColor(selectedHabitForColor) === color;
                  return (
                    <button
                      key={color}
                      onClick={() => handleUpdateColor(selectedHabitForColor, color)}
                      className="relative w-10 h-10 rounded-xl transition-transform hover:scale-110 focus:outline-none flex items-center justify-center"
                      style={{
                        backgroundColor: color,
                        boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none",
                      }}
                      title={color}
                    >
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
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
