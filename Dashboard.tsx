import { Button, Input, ThemeSettings } from "./ui-shims";
import { trpc } from "./trpc";
import { useAuth } from "./useAuth";
import { Flame, Plus, Trash2, LogOut, ChevronLeft, ChevronRight, Settings, MoreVertical, Edit2, Archive, ChevronUp, ChevronDown, Palette } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

type ViewType = "weekly" | "biweekly" | "monthly";

interface HabitGoal {
  [habitId: number]: number;
}

/**
 * Horizontal Calendar Habit Tracker
 * Matches DailyHabits with horizontal date row, checkboxes, and Goal/Achievement columns
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const [newHabitName, setNewHabitName] = useState("");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("monthly");
  const [habitGoals, setHabitGoals] = useState<HabitGoal>({});
  const [showSettings, setShowSettings] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingHabitName, setEditingHabitName] = useState("");
  const [selectedHabitForColor, setSelectedHabitForColor] = useState<number | null>(null);
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
    onSuccess: () => {
      // Refetch calendar data immediately
      utils.checkins.calendar.invalidate();
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

  // Calculate date range based on view type
  const dateRange = useMemo(() => {
    const end = new Date(currentDate);
    end.setHours(0, 0, 0, 0);
    
    const start = new Date(end);
    
    switch (viewType) {
      case "weekly":
        start.setDate(start.getDate() - 6);
        break;
      case "biweekly":
        start.setDate(start.getDate() - 13);
        break;
      case "monthly":
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
    }
    
    return { start, end };
  }, [currentDate, viewType]);

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

  // Calculate days for API call
  const daysCount = useMemo(() => {
    return Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [dateRange]);

  // Fetch calendar data for the first habit (simplified for now)
  const { data: calendarData } = trpc.checkins.calendar.useQuery(
    { 
      habitId: habits[0]?.id || 0,
      startDate: dateRange.start.toISOString().split('T')[0],
      endDate: dateRange.end.toISOString().split('T')[0],
    },
    { enabled: habits.length > 0 }
  );

  // Build completion map
  const completionMap = useMemo(() => {
    const map: Record<number, Record<string, boolean>> = {};
    
    habits.forEach(habit => {
      map[habit.id] = {};
    });

    if (calendarData?.calendar && habits[0]) {
      calendarData.calendar.forEach((item: any) => {
        map[habits[0]!.id][item.date] = item.completed;
      });
    }

    return map;
  }, [calendarData, habits]);

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
    if (viewType === "weekly") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewType === "biweekly") {
      newDate.setDate(newDate.getDate() - 14);
    } else if (viewType === "monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
      newDate.setDate(1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === "weekly") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewType === "biweekly") {
      newDate.setDate(newDate.getDate() + 14);
    } else if (viewType === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
      newDate.setDate(1);
    }
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
      <div className="border-b bg-card sticky top-0 z-20">
        <div className="max-w-full mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold">Habits Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 py-8">
        {/* Theme Settings Modal */}
        {showSettings && (
          <div className="mb-8 fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="p-4">
                <ThemeSettings onApply={() => setShowSettings(false)} />
              </div>
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-48 text-center">{formatDateHeader()}</span>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* View Type Dropdown */}
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="px-4 py-2 border rounded-lg bg-background text-foreground text-sm font-medium"
          >
            <option value="weekly">Weekly (7 days)</option>
            <option value="biweekly">Bi-weekly (14 days)</option>
            <option value="monthly">Monthly (30-31 days)</option>
          </select>
        </div>

        {/* Add Habit Form */}
        <div className="mb-8 flex justify-center">
          {!isAddingHabit ? (
            <Button onClick={() => setIsAddingHabit(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6">
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
          <div className="border rounded-lg bg-card overflow-visible">
            <div className="overflow-x-auto overflow-y-visible" style={{ overscrollBehavior: 'contain' }}>
            <table className="w-full text-sm border-collapse overflow-visible">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-sm min-w-40 sticky left-0 bg-muted/50 z-10">
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
                  <th className="px-4 py-3 text-center font-semibold text-sm border-l min-w-20 bg-blue-50 dark:bg-blue-950 sticky right-24 z-10">
                    Goal
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-sm border-l min-w-24 bg-green-50 dark:bg-green-950 sticky right-0 z-10">
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
                                className="fixed bg-background border rounded-lg shadow-2xl z-50 min-w-40"
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
                      <td className="px-4 py-3 text-center border-l bg-blue-50 dark:bg-blue-950 sticky right-24 z-10">
                        <input
                          type="number"
                          min="0"
                          value={goal}
                          onChange={(e) => setHabitGoals({
                            ...habitGoals,
                            [habit.id]: parseInt(e.target.value) || 0
                          })}
                          className="w-16 px-2 py-1 border rounded text-center bg-background text-foreground"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center border-l font-semibold bg-green-50 dark:bg-green-950 sticky right-0 z-10">
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
