import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import type { Role } from "@/types/api";

export function ProtectedRoute({
  roles,
  redirectTo = "/login/student",
}: {
  roles?: Role[];
  redirectTo?: string;
}) {
  const location = useLocation();
  const hydrated = useAuth((s) => s.hydrated);
  const token = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
