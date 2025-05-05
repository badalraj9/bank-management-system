import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/AuthProvider";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Transactions from "@/pages/Transactions";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  // Show nothing while checking auth status
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  // If authenticated, render the component
  return user ? <Component {...rest} /> : null;
}

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/accounts" component={() => <ProtectedRoute component={Accounts} />} />
        <Route path="/transactions" component={() => <ProtectedRoute component={Transactions} />} />
        <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
