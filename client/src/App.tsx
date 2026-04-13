import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Begin from "@/pages/Begin";
import Dashboard from "@/pages/Dashboard";
import MentorPortal from "@/pages/MentorPortal";
import MenteeDetails from "@/pages/MenteeDetails";
import Messages from "@/pages/Messages";
import Admin from "@/pages/Admin";
import Resources from "@/pages/Resources";
import ResourceDetail from "@/pages/ResourceDetail";
import Collections from "@/pages/Collections";
import Journal from "@/pages/Journal";
import PreviewLesson from "@/pages/PreviewLesson";

// Protected Route Wrapper
function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType, 
  allowedRoles?: string[] 
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />; // Or unauthorized page
  }

  return <Component />;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) return <Redirect to="/login" />;
  if (user.role === 'admin') return <Redirect to="/admin" />;
  if (user.role === 'mentor') return <Redirect to="/mentor" />;
  if (user.role === 'superuser') return <Redirect to="/dashboard" />;
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/begin" component={Begin} />

      {/* Root redirect */}
      <Route path="/" component={RootRedirect} />

      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} allowedRoles={['participant', 'superuser']} />
      </Route>

      <Route path="/mentor">
        <ProtectedRoute component={MentorPortal} allowedRoles={['mentor', 'admin']} />
      </Route>
      
      <Route path="/mentor/mentee/:id">
        <ProtectedRoute component={MenteeDetails} allowedRoles={['mentor', 'admin']} />
      </Route>

      <Route path="/messages">
        <ProtectedRoute component={Messages} />
      </Route>

      <Route path="/admin">
        <ProtectedRoute component={Admin} allowedRoles={['admin']} />
      </Route>

      <Route path="/resources/:id">
        <ProtectedRoute component={ResourceDetail} />
      </Route>

      <Route path="/resources">
        <ProtectedRoute component={Resources} />
      </Route>

      <Route path="/collections">
        <ProtectedRoute component={Collections} allowedRoles={['participant', 'superuser']} />
      </Route>

      <Route path="/testimonies">
        <Redirect to="/collections?tab=testimonies" />
      </Route>

      <Route path="/journal">
        <ProtectedRoute component={Journal} allowedRoles={['participant', 'superuser']} />
      </Route>

      <Route path="/preview/track-a/:day">
        <ProtectedRoute component={PreviewLesson} allowedRoles={['admin']} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
