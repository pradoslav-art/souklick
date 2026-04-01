import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import AppLayout from "@/components/layout/app-layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Priority from "@/pages/priority";
import Locations from "@/pages/locations";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Onboarding from "@/pages/onboarding";
import AdminDashboard from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: { component: any, [key: string]: any }) {
  const { data: user, isLoading, error } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && error) {
      setLocation("/login");
    }
  }, [isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <AppLayout>
      <Component {...rest} />
    </AppLayout>
  );
}

function Router() {
  const { data: user, isLoading, error } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/login" && user && !isLoading) {
      setLocation("/");
    }
  }, [location, user, isLoading, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/priority">
        <ProtectedRoute component={Priority} />
      </Route>
      <Route path="/locations">
        <ProtectedRoute component={Locations} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/settings/:tab">
        {(params) => <ProtectedRoute component={Settings} tab={params?.tab} />}
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
