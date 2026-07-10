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
import { ElectionsPage } from "./pages/admin/ElectionsPage";
import { PositionsPage } from "./pages/admin/PositionsPage";
import { CandidatesPage } from "./pages/admin/CandidatesPage";
import { StudentsPage } from "./pages/admin/StudentsPage";
import { OfficersPage } from "./pages/admin/OfficersPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { InstitutionsPage } from "./pages/admin/InstitutionsPage";
import { ResultsPage } from "./pages/ResultsPage";
import { StudentElectionsPage } from "./pages/student/ElectionsPage";
import { VotePage } from "./pages/student/VotePage";
import { ProfilePage } from "./pages/student/ProfilePage";

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
              <Route path="elections" element={<ElectionsPage />} />
              <Route path="positions" element={<PositionsPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="officers" element={<OfficersPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="audit" element={<AuditLogsPage />} />
              <Route path="settings" element={<InstitutionsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["STUDENT"]} redirectTo="/login/student" />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="elections" element={<StudentElectionsPage />} />
              <Route path="vote/:electionId" element={<VotePage />} />
              <Route path="results" element={<ResultsPage audience="student" />} />
              <Route path="profile" element={<ProfilePage />} />
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
