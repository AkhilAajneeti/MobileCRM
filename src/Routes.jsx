import React from "react";
import { HashRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import FollowupReminderManager from "components/FollowupReminderManager";
import NativeNotificationManager from "components/NativeNotificationManager";
import NotFound from "pages/NotFound";
import Settings from "./pages/settings";
import IntegrationsPage from "./pages/integrations";
import DealsPage from "./pages/deals";
// import ContactsPage from "./pages/contacts";
import LoginPage from "./pages/login";
import EmailsPage from "./pages/emails";
import AccountsPage from "./pages/accounts";
import Dashboard from "./pages/dashboard";
import Reports from "./pages/reports";
import Activities from "./pages/activities";
import Profile from "pages/profile";
import Login from "./pages/login";
import ProtectedRoute from "routes/ProtectedRoute";
import TaskPage from "pages/tasks";
import MeetingPage from "pages/meeting";
import CallPage from "./pages/call";
import Pipeline from "pages/pipeline";
import ProjectsPage from "pages/projects";
import SalesTeam from "pages/sales-team";
import HelpPage from "pages/help";
const Routes = () => {
  return (
    <HashRouter>
      <ErrorBoundary>
        <ScrollToTop />
        {/* Global follow-up reminder timer - lives above the routes so it keeps
            running on every page (mounted once, survives navigation). */}
        <FollowupReminderManager />
        <NativeNotificationManager />
        <RouterRoutes>
          {/* Define your route here */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <DealsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-team"
            element={
              <ProtectedRoute>
                <SalesTeam />
              </ProtectedRoute>
            }
          />
          {/* <Route path="/contacts" element={<ContactsPage />} /> */}
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/emails"
            element={
              <ProtectedRoute>
                <EmailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <Activities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting"
            element={
              <ProtectedRoute>
                <MeetingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/call"
            element={
              <ProtectedRoute>
                <CallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            }
          />
          {/* Help Center — three patterns, same component, dispatches via useParams */}
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/:categoryId"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/:categoryId/:articleId"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </HashRouter>
  );
};

export default Routes;
