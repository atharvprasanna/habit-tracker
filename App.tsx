import { Switch, Route } from "wouter";
import Dashboard from "./Dashboard";
import HabitDetail from "./HabitDetail";
import DashboardLayout from "./DashboardLayout";
import Login from "./Login";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./useAuth";

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
