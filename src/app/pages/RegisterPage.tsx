import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { institutionsApi } from "@/api/institutions";
import { useAuth } from "@/store/auth";

const schema = z
  .object({
    matricNumber: z.string().trim().min(3, "Matric number is required").max(64),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    facultyId: z.string().optional(),
    departmentId: z.string().optional(),
    levelId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      matricNumber: "",
      password: "",
      confirmPassword: "",
      facultyId: "",
      departmentId: "",
      levelId: "",
    },
  });
  const faculties = useQuery({
    queryKey: ["institutions", "faculties"],
    queryFn: institutionsApi.faculties.list,
  });
  const departments = useQuery({
    queryKey: ["institutions", "departments", form.watch("facultyId")],
    queryFn: () => institutionsApi.departments.list(form.getValues("facultyId") || undefined),
  });
  const levels = useQuery({
    queryKey: ["institutions", "levels"],
    queryFn: institutionsApi.levels.list,
  });

  const mutation = useMutation({
    mutationFn: authApi.studentRegister,
    onSuccess: async (res) => {
      if (res.accessToken || res.data?.accessToken || res.token) {
        setSession(res);
        if (!res.user && !res.data?.user) {
          const profile = await authApi.me().catch(() => null);
          if (profile) useAuth.getState().setUser(profile);
        }
        toast.success("Account created");
        navigate("/student", { replace: true });
      } else {
        toast.success("Registration submitted. Please sign in.");
        navigate("/login/student", { replace: true });
      }
    },
  });

  return (
    <Card className="glass border-white/40 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Create your account</CardTitle>
        <CardDescription>Register as an ADUN student to vote</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) =>
            mutation.mutate({
              matricNumber: v.matricNumber,
              password: v.password,
              facultyId: v.facultyId || undefined,
              departmentId: v.departmentId || undefined,
              levelId: v.levelId || undefined,
            }),
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="matric">Matric Number</Label>
            <Input id="matric" placeholder="ENG123456" {...form.register("matricNumber")} />
            {form.formState.errors.matricNumber && (
              <p className="text-xs text-destructive">
                {form.formState.errors.matricNumber.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <select
                id="faculty"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                {...form.register("facultyId", {
                  onChange: () => form.setValue("departmentId", ""),
                })}
              >
                <option value="">Select faculty</option>
                {(faculties.data ?? []).map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={!form.watch("facultyId")}
                {...form.register("departmentId")}
              >
                <option value="">Select department</option>
                {(departments.data ?? []).map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <select
              id="level"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("levelId")}
            >
              <option value="">Select level</option>
              {(levels.data ?? []).map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login/student" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
