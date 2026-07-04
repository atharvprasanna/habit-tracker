import { useAuth } from "./useAuth";
import { Button, Card } from "./ui-shims";
import { trpc } from "./trpc";
import { ArrowLeft, Flame, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function HabitDetail({ params }: { params: { habitId: string } }) {
  const [, setLocation] = useLocation();
  const habitId = parseInt(params.habitId);
  const utils = trpc.useUtils();
  const [days, setDays] = useState(30);

  // Fetch habit details
  const { data: habit, isLoading } = trpc.habits.get.useQuery({ habitId });

  // Fetch calendar data
  const { data: calendar } = trpc.checkins.calendar.useQuery({ habitId, days });

  // Check in mutation
  const checkInMutation = trpc.checkins.create.useMutation({
    onSuccess: () => {
      utils.habits.get.invalidate({ habitId });
      utils.checkins.calendar.invalidate({ habitId, days });
      toast.success("Check-in recorded!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check in");
    },
  });

  const handleCheckIn = (dateStr: string) => {
    checkInMutation.mutate({ habitId, date: dateStr });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading habit details...</p>
        </div>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold mb-4">Habit not found</p>
          <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{habit.name}</h1>
              {habit.description && <p className="text-muted-foreground mt-2">{habit.description}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{habit.currentStreak}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-amber-600 opacity-50" />
              <div>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
                <p className="text-3xl font-bold">{habit.longestStreak}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completions</p>
                <p className="text-3xl font-bold">{calendar?.completionCount ?? 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar View */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Progress Calendar</h2>
            <div className="flex gap-2 mb-4">
              {[7, 14, 30, 60, 90].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "outline"}
                  onClick={() => setDays(d)}
                  size="sm"
                >
                  {d} days
                </Button>
              ))}
            </div>
          </div>

          {calendar && calendar.calendar.length > 0 ? (
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {calendar.calendar.map((day) => {
                const isToday = new Date().toISOString().split("T")[0] === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => handleCheckIn(day.date)}
                    disabled={checkInMutation.isPending}
                    className={`calendar-cell ${day.completed ? "completed" : ""} ${isToday ? "today" : ""}`}
                    title={day.date}
                  >
                    {day.completed ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No data available for this period</p>
            </div>
          )}
        </Card>

        {/* Quick Check-in */}
        <div className="mt-8">
          <Button
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              handleCheckIn(today);
            }}
            disabled={checkInMutation.isPending}
            size="lg"
            className="w-full"
          >
            {checkInMutation.isPending ? "Checking in..." : "Check In Today"}
          </Button>
        </div>
      </div>
    </div>
  );
}
