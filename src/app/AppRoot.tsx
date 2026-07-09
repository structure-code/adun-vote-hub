import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { setOnUnauthorized } from "@/api/axios";
import { useAuth } from "@/store/auth";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "./layouts/AuthLayout";
import { AdminLayout, StudentLayout } from "./layouts/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLoginPage, StudentLoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { PlaceholderPage } from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

export function AppRoot() {
  useEffect(() => {
    setOnUnauthorized(() => {
      useAuth.getState().clear();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Navigate to="/login/student" replace />} />
            <Route path="/login/student" element={<StudentLoginPage />} />
            <Route path="/login/admin" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                roles={["ADMIN", "SUPER_ADMIN", "ELECTION_OFFICER"]}
                redirectTo="/login/admin"
              />
            }
          >
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="elections" element={<PlaceholderPage title="Elections" />} />
              <Route path="positions" element={<PlaceholderPage title="Positions" />} />
              <Route path="candidates" element={<PlaceholderPage title="Candidates" />} />
              <Route path="students" element={<PlaceholderPage title="Students" />} />
              <Route path="officers" element={<PlaceholderPage title="Election Officers" />} />
              <Route path="results" element={<PlaceholderPage title="Results" />} />
              <Route path="audit" element={<PlaceholderPage title="Audit Logs" />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["STUDENT"]} redirectTo="/login/student" />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="elections" element={<PlaceholderPage title="Elections" />} />
              <Route path="vote/:electionId" element={<PlaceholderPage title="Cast your vote" />} />
              <Route path="history" element={<PlaceholderPage title="Voting History" />} />
              <Route path="results" element={<PlaceholderPage title="Results" />} />
              <Route path="profile" element={<PlaceholderPage title="Profile" />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
