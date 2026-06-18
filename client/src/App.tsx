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
import PrayerToolkit from "@/pages/PrayerToolkit";
import CaptivityBuilderResource from "@/pages/CaptivityBuilderResource";
import ConfessionFinderResource from "@/pages/ConfessionFinderResource";
import FreedomWorkbookResource from "@/pages/FreedomWorkbookResource";
import WorkbookPage from "@/pages/WorkbookPage";
import HealingDashboard from "@/pages/HealingDashboard";
import HealingLesson from "@/pages/HealingLesson";
import HealingJournal from "@/pages/HealingJournal";
import ProfilePage from "@/pages/ProfilePage";
import ProgramOverview from "@/pages/ProgramOverview";
import SmsPrivacy from "@/pages/SmsPrivacy";
import SmsOptin from "@/pages/SmsOptin";
import MentorProgram from "@/pages/MentorProgram";

// Standard Protected Route Wrapper — role-based
function ProtectedRoute({ 
  component: Component, 
  allowedRoles,
  excludeTrackC,
}: { 
  component: React.ComponentType, 
  allowedRoles?: string[],
  excludeTrackC?: boolean,
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  // Healing Track (C) participants have no access to messages, collections, or legacy journal
  if (excludeTrackC && user.role !== 'admin' && user.track === 'C') {
    return <Redirect to="/healing" />;
  }

  return <Component />;
}

// Redirect /testimonies to collections, but track C users go to /healing
function TestimoniesRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Redirect to="/login" />;
  if (user.track === 'C' && user.role !== 'admin') return <Redirect to="/healing" />;
  return <Redirect to="/collections?tab=testimonies" />;
}

// Healing Track Protected Route — only Track C participants and admins
function HealingProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== 'admin' && user.track !== 'C') {
    return <Redirect to="/dashboard" />;
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
  if (user.track === 'C') return <Redirect to="/healing" />;
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

      <Route path="/mentor/program">
        <ProtectedRoute component={MentorProgram} allowedRoles={['mentor', 'admin']} />
      </Route>

      <Route path="/messages">
        <ProtectedRoute component={Messages} excludeTrackC />
      </Route>

      <Route path="/admin">
        <ProtectedRoute component={Admin} allowedRoles={['admin']} />
      </Route>

      <Route path="/resources/tools/captivity-builder">
        <ProtectedRoute component={CaptivityBuilderResource} />
      </Route>

      <Route path="/resources/tools/confession-finder">
        <ProtectedRoute component={ConfessionFinderResource} />
      </Route>


      <Route path="/workbook">
        <ProtectedRoute component={WorkbookPage} allowedRoles={['participant', 'superuser']} />
      </Route>

      <Route path="/resources/tools/freedom-workbook/:sectionId">
        <ProtectedRoute component={FreedomWorkbookResource} />
      </Route>

      <Route path="/resources/tools/freedom-workbook">
        <ProtectedRoute component={FreedomWorkbookResource} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>

      <Route path="/resources/:id">
        <ProtectedRoute component={ResourceDetail} />
      </Route>

      <Route path="/resources">
        <ProtectedRoute component={Resources} />
      </Route>

      <Route path="/collections">
        <ProtectedRoute component={Collections} allowedRoles={['participant', 'superuser']} excludeTrackC />
      </Route>

      <Route path="/testimonies">
        <TestimoniesRedirect />
      </Route>

      <Route path="/journal">
        <ProtectedRoute component={Journal} allowedRoles={['participant', 'superuser']} excludeTrackC />
      </Route>

      <Route path="/toolkit">
        <ProtectedRoute component={PrayerToolkit} allowedRoles={['participant', 'superuser']} />
      </Route>

      <Route path="/program-overview">
        <ProtectedRoute component={ProgramOverview} allowedRoles={['participant', 'superuser']} />
      </Route>

      <Route path="/sms-privacy" component={SmsPrivacy} />
      <Route path="/sms-optin" component={SmsOptin} />

      <Route path="/preview/track-a/:day">
        <ProtectedRoute component={PreviewLesson} allowedRoles={['admin', 'mentor']} />
      </Route>

      {/* Healing Track — Track C participants and admins only */}
      <Route path="/healing/module/:n">
        <HealingProtectedRoute component={HealingLesson} />
      </Route>

      <Route path="/healing/journal">
        <HealingProtectedRoute component={HealingJournal} />
      </Route>

      <Route path="/healing">
        <HealingProtectedRoute component={HealingDashboard} />
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
