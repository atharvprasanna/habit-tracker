import { Button, Card } from "./ui-shims";
import { Flame, Calendar, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // In standalone mode, we just go to the dashboard
    setLocation("/dashboard");
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-lg">Habit Tracker</span>
          </div>
        </div>
      </nav>

      <div className="container py-20 md:py-32">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Build Better Habits,
            <span className="text-accent"> One Day at a Time</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Track your daily habits, build streaks, and visualize your progress with our simple and powerful habit tracker.
          </p>
          <Button onClick={() => setLocation("/dashboard")} size="lg" className="gap-2">
            Get Started
            <Flame className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Track Streaks</h3>
            <p className="text-sm text-muted-foreground">
              Build momentum with streak tracking. See your current and longest streaks at a glance.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Visual Calendar</h3>
            <p className="text-sm text-muted-foreground">
              See your completion history with an interactive calendar view spanning 7 to 90 days.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Unlimited Habits</h3>
            <p className="text-sm text-muted-foreground">
              Create as many habits as you want and customize each one with colors and descriptions.
            </p>
          </Card>
        </div>
      </div>

      <footer className="border-t border-border bg-background/50 mt-20">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Habit Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
