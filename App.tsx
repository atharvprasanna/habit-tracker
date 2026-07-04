import { Switch, Route } from "wouter";
import Home from "./Home";
import Dashboard from "./Dashboard";
import HabitDetail from "./HabitDetail";
import DashboardLayout from "./DashboardLayout";
import { Toaster } from "sonner";

function App() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/habit/:id" component={HabitDetail} />
        <Route>404 Page Not Found</Route>
      </Switch>
      <Toaster position="top-right" />
    </DashboardLayout>
  );
}

export default App;
