import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, IdCard, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AccountSettings } from "@/app/components/AccountSettings";
import { authApi } from "@/api/auth";
import { institutionsApi } from "@/api/institutions";
import { studentsApi } from "@/api/students";
import { useAuth } from "@/store/auth";
import { studentIdCardUrl } from "@/lib/student-id-card";
import { positiveStatusBadgeClass } from "@/lib/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const [idCardFile, setIdCardFile] = useState<File | null>(null);

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

  useEffect(() => {
    if (!profile.data?.studentProfile) return;
    const sp = profile.data.studentProfile;
    setForm({
      facultyId: sp.facultyId || "",
      departmentId: sp.departmentId || "",
      levelId: sp.levelId || "",
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

      const mergedUser: User = {
        ...currentData,
        ...updatedUser,
        studentProfile: {
          ...(currentData.studentProfile || {}),
          ...(updatedUser?.studentProfile || {}),
          facultyId: updatedUser?.studentProfile?.facultyId ?? form.facultyId,
          departmentId: updatedUser?.studentProfile?.departmentId ?? form.departmentId,
          levelId: updatedUser?.studentProfile?.levelId ?? form.levelId,
          id: currentData.studentProfile?.id ?? "",
          userId: currentData.id,
          isActive:
            updatedUser?.studentProfile?.isActive ?? currentData.studentProfile?.isActive ?? true,
          isVerified:
            updatedUser?.studentProfile?.isVerified ??
            currentData.studentProfile?.isVerified ??
            false,
        },
      };

      client.setQueryData(["profile"], mergedUser);
      setUser(mergedUser);
      toast.success("Student profile updated");
    },
  });

  const uploadIdCard = useMutation({
    mutationFn: studentsApi.uploadIdCard,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["profile"] });
      setIdCardFile(null);
      toast.success("Student ID uploaded for verification");
    },
  });

  if (profile.isLoading) return <Skeleton className="h-64" />;

  const user = profile.data;
  const studentProfile = user?.studentProfile;
  const idCardUrl = studentIdCardUrl(studentProfile);

  const institutionName = (value: { name?: string } | string | undefined, fallback?: string) =>
    typeof value === "string" ? value : value?.name || fallback;

  const currentLevelName = institutionName(
    studentProfile?.level,
    studentProfile?.levelRecord?.name,
  );

  const rows = [
    [
      "Matric number",
      <span className="font-medium" key="matric">
        {user?.matricNumber || "Not set"}
      </span>,
    ],
    [
      "Email",
      <span className="font-medium" key="email">
        {user?.email || "Not set"}
      </span>,
    ],
    [
      "Role",
      <span className="font-medium" key="role">
        {user?.role}
      </span>,
    ],
    [
      "Faculty",
      <span className="font-medium" key="faculty">
        {institutionName(
          studentProfile?.faculty,
          studentProfile?.facultyRecord?.name || studentProfile?.facultyId,
        ) || "Not set"}
      </span>,
    ],
    [
      "Department",
      <span className="font-medium" key="dept">
        {institutionName(
          studentProfile?.department,
          studentProfile?.departmentRecord?.name || studentProfile?.departmentId,
        ) || "Not set"}
      </span>,
    ],
    [
      "Level",
      <span className="font-medium" key="level">
        {currentLevelName || "Not set"}
      </span>,
    ],
    [
      "Account active",
      studentProfile?.isActive !== false ? (
        <Badge key="active" className={positiveStatusBadgeClass}>
          Active
        </Badge>
      ) : (
        <Badge key="inactive" variant="destructive">
          Inactive
        </Badge>
      ),
    ],
    [
      "Verified",
      studentProfile?.isVerified ? (
        <Badge key="verified" className={positiveStatusBadgeClass}>
          Verified
        </Badge>
      ) : (
        <Badge key="unverified" variant="secondary">
          Unverified
        </Badge>
      ),
    ],
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
              <div
                key={label as string}
                className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-3 text-sm items-center"
              >
                <span className="text-muted-foreground">{label}</span>
                <div className="wrap-break-word">{value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span>Academic profile</span>
              {currentLevelName && (
                <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                  {currentLevelName}
                </Badge>
              )}
            </CardTitle>
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
                  key={faculties.isLoading ? "loading" : form.facultyId}
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
                  key={departments.isLoading ? "loading" : form.departmentId}
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
                  key={levels.isLoading ? "loading" : form.levelId}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="inline-flex items-center gap-2">
                <IdCard className="h-5 w-5 text-primary" />
                Student ID verification
              </span>
              {studentProfile?.isVerified ? (
                <Badge className={positiveStatusBadgeClass}>Verified</Badge>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (idCardFile) uploadIdCard.mutate(idCardFile);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="student-id-card">Upload student ID card</Label>
                <Input
                  id="student-id-card"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => setIdCardFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear image or PDF of your student ID for admin approval.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!idCardFile || uploadIdCard.isPending}>
                  {uploadIdCard.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload ID
                </Button>
                {idCardUrl && (
                  <Button asChild type="button" variant="outline">
                    <a href={idCardUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View uploaded ID
                    </a>
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <AccountSettings />
    </div>
  );
}
