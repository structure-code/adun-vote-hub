import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { useAuth } from "@/store/auth";
import type { AuthResponse } from "@/types/api";

const adminSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

const studentSchema = z.object({
  matricNumber: z.string().trim().min(3, "Matric number is required").max(64),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

type AdminForm = z.infer<typeof adminSchema>;
type StudentForm = z.infer<typeof studentSchema>;
type LoginMode = "student" | "admin";

export function LoginPage({ mode }: { mode: LoginMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuth((s) => s.setSession);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  function afterLogin(res: AuthResponse, fallback: string) {
    setSession(res);
    // Hydrate profile if not included in response
    if (!res.user && !res.data?.user) {
      authApi
        .me()
        .then((u) => useAuth.getState().setUser(u))
        .catch(() => null);
    }
    toast.success("Signed in");
    navigate(from || fallback, { replace: true });
  }

  const adminForm = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: { email: "", password: "" },
  });
  const studentForm = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { matricNumber: "", password: "" },
  });

  const adminMutation = useMutation({
    mutationFn: authApi.adminLogin,
    onSuccess: (res) => afterLogin(res, "/admin"),
  });
  const studentMutation = useMutation({
    mutationFn: authApi.studentLogin,
    onSuccess: (res) => afterLogin(res, "/student"),
  });

  const isStudent = mode === "student";
  const title = isStudent ? "Student sign in" : "Admin sign in";
  const description = isStudent
    ? "Access your ADUN student voting dashboard"
    : "Manage ADUN elections, candidates, results, and audit logs";
  return (
    <Card className="glass border-white/40 shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {isStudent ? <GraduationCap className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </div>
        <CardTitle className="font-display text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isStudent ? (
          <form
            className="space-y-4"
            onSubmit={studentForm.handleSubmit((v) => studentMutation.mutate(v))}
          >
            <div className="space-y-2">
              <Label htmlFor="matric">Matric Number</Label>
              <Input
                id="matric"
                placeholder="e.g. ENG123456"
                autoComplete="username"
                {...studentForm.register("matricNumber")}
              />
              {studentForm.formState.errors.matricNumber && (
                <p className="text-xs text-destructive">
                  {studentForm.formState.errors.matricNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-password">Password</Label>
              <div className="relative">
                <Input
                  id="s-password"
                  type={showStudentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  {...studentForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowStudentPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showStudentPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showStudentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {studentForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {studentForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={studentMutation.isPending}>
              {studentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New student?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Register
              </Link>
            </p>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={adminForm.handleSubmit((v) => adminMutation.mutate(v))}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@adun.edu.ng"
                autoComplete="username"
                {...adminForm.register("email")}
              />
              {adminForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {adminForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-password">Password</Label>
              <div className="relative">
                <Input
                  id="a-password"
                  type={showAdminPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  {...adminForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showAdminPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showAdminPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {adminForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {adminForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={adminMutation.isPending}>
              {adminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentLoginPage() {
  return <LoginPage mode="student" />;
}

export function AdminLoginPage() {
  return <LoginPage mode="admin" />;
}