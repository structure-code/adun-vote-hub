import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AccountSettings } from "@/app/components/AccountSettings";
import { authApi } from "@/api/auth";
import { institutionsApi } from "@/api/institutions";
import { studentsApi } from "@/api/students";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/api";

type AcademicForm = { facultyId: string; departmentId: string; levelId: string };
const emptyForm: AcademicForm = { facultyId: "", departmentId: "", levelId: "" };

export function ProfilePage() {
  const client = useQueryClient();
  const setUser = useAuth((state) => state.setUser);
  const [form, setForm] = useState<AcademicForm>(emptyForm);
  
  const profile = useQuery({ queryKey: ["profile"], queryFn: authApi.me });
  
  const faculties = useQuery({
    queryKey: ["institutions", "faculties"],
    queryFn: institutionsApi.faculties.list,
  });
  
  const departments = useQuery({
    queryKey: ["institutions", "departments", form.facultyId],
    queryFn: () => institutionsApi.departments.list(form.facultyId),
    enabled: !!form.facultyId,
  });
  
  const levels = useQuery({
    queryKey: ["institutions", "levels"],
    queryFn: institutionsApi.levels.list,
  });

  // Populate form tracking the nested studentProfile object
  useEffect(() => {
    if (!profile.data?.studentProfile) return;
    const sp = profile.data.studentProfile;
    setForm({
      facultyId: sp.facultyId ?? "",
      departmentId: sp.departmentId ?? "",
      levelId: sp.levelId ?? "",
    });
  }, [profile.data]);

  const updateAcademicProfile = useMutation({
    mutationFn: () =>
      studentsApi.updateMe({
        facultyId: form.facultyId || undefined,
        departmentId: form.departmentId || undefined,
        levelId: form.levelId || undefined,
      }),
    onSuccess: (updatedUser) => {
  const currentData = profile.data!;
  
  // Explicitly type it as your 'User' interface
  const mergedUser: User = {
    ...currentData,
    ...updatedUser,
    studentProfile: {
      ...(currentData.studentProfile || {}),
      ...(updatedUser?.studentProfile || {}),
      // Use 'as string' or fallback to ensure it matches your interface strings
      facultyId: updatedUser?.studentProfile?.facultyId ?? form.facultyId,
      departmentId: updatedUser?.studentProfile?.departmentId ?? form.departmentId,
      levelId: updatedUser?.studentProfile?.levelId ?? form.levelId,
      // Carry over structural fields from old state if updatedUser lacks them
      id: currentData.studentProfile?.id ?? "",
      userId: currentData.id,
      isActive: updatedUser?.studentProfile?.isActive ?? currentData.studentProfile?.isActive ?? true,
      isVerified: updatedUser?.studentProfile?.isVerified ?? currentData.studentProfile?.isVerified ?? false,
    },
  };

  client.setQueryData(["profile"], mergedUser);
  setUser(mergedUser);
  toast.success("Student profile updated");
},
  });

  if (profile.isLoading) return <Skeleton className="h-64" />;
  
  const user = profile.data;
  const studentProfile = user?.studentProfile;

  const institutionName = (value: { name?: string } | string | undefined, fallback?: string) =>
    typeof value === "string" ? value : value?.name || fallback;

  const rows = [
    ["Matric number", user?.matricNumber],
    ["Email", user?.email],
    ["Role", user?.role],
    [
      "Faculty", 
      institutionName(studentProfile?.faculty, studentProfile?.facultyRecord?.name || studentProfile?.facultyId)
    ],
    [
      "Department",
      institutionName(studentProfile?.department, studentProfile?.departmentRecord?.name || studentProfile?.departmentId),
    ],
    [
      "Level", 
      institutionName(studentProfile?.level, studentProfile?.levelRecord?.name || studentProfile?.levelId)
    ],
    ["Account active", studentProfile?.isActive === false ? "No" : "Yes"],
    ["Verified", studentProfile?.isVerified ? "Yes" : "No"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your student information, credentials, and account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="wrap-break-word font-medium">{value || "Not set"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Academic profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                updateAcademicProfile.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="profile-faculty">Faculty</Label>
                <Select
                  value={form.facultyId || undefined}
                  onValueChange={(facultyId) => setForm({ ...form, facultyId, departmentId: "" })}
                  disabled={faculties.isLoading}
                >
                  <SelectTrigger id="profile-faculty">
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {(faculties.data ?? []).map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-department">Department</Label>
                <Select
                  value={form.departmentId || undefined}
                  onValueChange={(departmentId) => setForm({ ...form, departmentId })}
                  disabled={!form.facultyId || departments.isLoading}
                >
                  <SelectTrigger id="profile-department">
                    <SelectValue
                      placeholder={form.facultyId ? "Select department" : "Select a faculty first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments.data ?? []).map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-level">Level</Label>
                <Select
                  value={form.levelId || undefined}
                  onValueChange={(levelId) => setForm({ ...form, levelId })}
                  disabled={levels.isLoading}
                >
                  <SelectTrigger id="profile-level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {(levels.data ?? []).map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={updateAcademicProfile.isPending}>
                {updateAcademicProfile.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save academic profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <AccountSettings />
    </div>
  );
}