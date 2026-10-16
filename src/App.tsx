import { Switch, Route } from "wouter";
import Dashboard from "./features/habits/Dashboard";
import HabitDetail from "./features/habits/HabitDetail";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./features/auth/Login";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./features/auth/useAuth";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
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
