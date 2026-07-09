import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/api/auth";
import { useAuth } from "@/store/auth";

const schema = z.object({
  matricNumber: z.string().trim().min(3, "Matric number is required").max(64),
  password: z.string().min(8, "Use at least 8 characters").max(128),
  faculty: z.string().trim().max(100).optional().or(z.literal("")),
  department: z.string().trim().max(100).optional().or(z.literal("")),
  level: z.string().trim().max(20).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { matricNumber: "", password: "", faculty: "", department: "", level: "" },
  });

  const mutation = useMutation({
    mutationFn: authApi.studentRegister,
    onSuccess: (res) => {
      if (res.accessToken || res.data?.accessToken || res.token) {
        setSession(res);
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
              faculty: v.faculty || undefined,
              department: v.department || undefined,
              level: v.level || undefined,
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
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <Input id="faculty" placeholder="Engineering" {...form.register("faculty")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Computer Science"
                {...form.register("department")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Input id="level" placeholder="100L" {...form.register("level")} />
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
