import { Switch, Route } from "wouter";
import Dashboard from "./features/habits/Dashboard";
import HabitDetail from "./features/habits/HabitDetail";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./features/auth/Login";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./features/auth/useAuth";

function AppRoutes() {
  const { isAuthenticated, loading, recovering } = useAuth();

  // Restoring the saved session: avoid flashing the login screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  // Not signed in, or opened a password-reset link (must choose a new password first)
  if (!isAuthenticated || recovering) {
    return (
      <>
        <Login />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/habit/:id" component={HabitDetail} />
        <Route>
          <div className="p-8 text-center text-muted-foreground">404 — Page not found</div>
        </Route>
      </Switch>
      <Toaster position="top-right" />
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
