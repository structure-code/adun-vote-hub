import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { institutionsApi } from "@/api/institutions";
import { studentsApi } from "@/api/students";
import { usersApi } from "@/api/users";
import { useAuth } from "@/store/auth";
import { studentIdCardUrl } from "@/lib/student-id-card";
import { positiveStatusBadgeClass } from "@/lib/status-badges";
import type { StudentRecord, UpdateStudentProfileDto } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NOT_SET = "__not_set";

export function StudentsPage() {
  const client = useQueryClient();
  const currentUser = useAuth((state) => state.user);
  const canDeleteUsers = currentUser?.role === "SUPER_ADMIN";
  const [search, setSearch] = useState("");
  const [searchedStudent, setSearchedStudent] = useState<StudentRecord | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateStudentProfileDto>({});
  const students = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });
  const selected = useQuery({
    queryKey: ["students", selectedId],
    queryFn: () => studentsApi.get(selectedId!),
    enabled: !!selectedId,
  });
  const faculties = useQuery({
    queryKey: ["institutions", "faculties"],
    queryFn: institutionsApi.faculties.list,
  });
  const departments = useQuery({
    queryKey: ["institutions", "departments", form.facultyId],
    queryFn: () => institutionsApi.departments.list(form.facultyId!),
    enabled: !!selectedId && !!form.facultyId,
  });
  const levels = useQuery({
    queryKey: ["institutions", "levels"],
    queryFn: institutionsApi.levels.list,
  });

  useEffect(() => {
    if (!selected.data) return;
    const profile = selected.data.studentProfile ?? selected.data;
    setForm({
      facultyId: profile.facultyId || undefined,
      departmentId: profile.departmentId || undefined,
      levelId: profile.levelId || undefined,
      isActive: profile.isActive ?? true,
      isVerified: profile.isVerified ?? false,
    });
  }, [selected.data]);

  const update = useMutation({
    mutationFn: () => studentsApi.update(selectedId!, form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated");
      setSelectedId(null);
    },
  });
  const importStudents = useMutation({
    mutationFn: studentsApi.import,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student file imported");
    },
  });
  const searchStudent = useMutation({
    mutationFn: studentsApi.search,
    onSuccess: setSearchedStudent,
  });
  const verifyStudent = useMutation({
    mutationFn: studentsApi.verify,
    onSuccess: (_updated, studentId) => {
      client.invalidateQueries({ queryKey: ["students"] });
      client.invalidateQueries({ queryKey: ["students", studentId] });
      setForm((current) => ({ ...current, isVerified: true }));
      setSearchedStudent((current) => {
        if (!current || current.id !== studentId) return current;
        return {
          ...current,
          isVerified: true,
          studentProfile: current.studentProfile
            ? { ...current.studentProfile, isVerified: true }
            : current.studentProfile,
        };
      });
      toast.success("Student ID approved");
    },
  });
  const deleteUser = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["students"] });
      setSearchedStudent(null);
      toast.success("Student account deleted");
    },
  });
  const displayedStudents = searchedStudent ? [searchedStudent] : (students.data ?? []);
  const selectedIdCardUrl = studentIdCardUrl(selected.data);

  function label(student: StudentRecord) {
    return (
      student.user?.matricNumber ||
      student.matricNumber ||
      student.studentProfile?.user?.matricNumber ||
      "Matric number unavailable"
    );
  }
  function departmentName(student: StudentRecord) {
    return (
      student.department?.name ||
      student.studentProfile?.department?.name ||
      student.departmentId ||
      student.studentProfile?.departmentId
    );
  }
  function userId(student: StudentRecord) {
    return student.userId || student.user?.id || student.studentProfile?.user?.id || student.id;
  }
  function profileStatus(student: StudentRecord) {
    return student.studentProfile ?? student;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Students</h2>
        <p className="text-sm text-muted-foreground">
          Review student records, verification, eligibility, and bulk imports.
        </p>
      </div>
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!search.trim()) {
                setSearchedStudent(null);
                return;
              }
              setSearchedStudent(null);
              searchStudent.mutate(search.trim());
            }}
          >
            <Label htmlFor="student-search">Search by matric number or nickname</Label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="student-search"
                  className="pl-9"
                  placeholder="ADUN/FS/SEN/22/036"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={searchStudent.isPending}>
                {searchStudent.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="sr-only">Search student</span>
              </Button>
              {searchedStudent && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSearch("");
                    setSearchedStudent(null);
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </form>
          <div>
            <Input
              id="student-import"
              className="hidden"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importStudents.mutate(file);
                e.target.value = "";
              }}
            />
            <Button asChild variant="outline" disabled={importStudents.isPending}>
              <label htmlFor="student-import" className="cursor-pointer">
                {importStudents.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Import Excel
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>
      {students.isLoading || searchStudent.isPending ? (
        <Skeleton className="h-60" />
      ) : displayedStudents.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No students found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Verified</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayedStudents.map((student) => {
                  const status = profileStatus(student);
                  const idCardUrl = studentIdCardUrl(student);
                  const canApproveId = Boolean(idCardUrl);

                  return (
                    <tr key={student.id}>
                      <td className="p-4">
                        <div className="font-medium">{label(student)}</div>
                        <div className="text-xs text-muted-foreground">
                          {departmentName(student) || "Department not set"}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={status.isActive === false ? "destructive" : "outline"}
                          className={
                            status.isActive === false ? undefined : positiveStatusBadgeClass
                          }
                        >
                          {status.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {status.isVerified ? (
                          <Badge className={positiveStatusBadgeClass}>Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {idCardUrl && (
                            <Button asChild size="sm" variant="outline">
                              <a href={idCardUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                ID
                              </a>
                            </Button>
                          )}
                          {!status.isVerified && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={verifyStudent.isPending || !canApproveId}
                              title={
                                canApproveId
                                  ? "Approve uploaded student ID"
                                  : "Student ID has not been uploaded"
                              }
                              onClick={() => {
                                if (canApproveId) verifyStudent.mutate(student.id);
                              }}
                            >
                              {verifyStudent.isPending ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              )}
                              Approve ID
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedId(student.id)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Manage
                          </Button>
                          {canDeleteUsers && userId(student) !== currentUser?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Delete {label(student)}</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {label(student)}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently removes the user account and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser.mutate(userId(student))}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete user
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={!!selectedId}
        onOpenChange={(value) => {
          if (!value) setSelectedId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage student</DialogTitle>
          </DialogHeader>
          {selected.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                update.mutate();
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Student ID approval</div>
                  <div className="text-xs text-muted-foreground">
                    {form.isVerified
                      ? "This student's ID has been approved."
                      : selectedIdCardUrl
                        ? "Approve the uploaded ID to verify this student."
                      : "Approve the uploaded ID to verify this student."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedIdCardUrl && (
                    <Button asChild type="button" variant="outline" size="sm">
                      <a href={selectedIdCardUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        View ID
                      </a>
                    </Button>
                  )}
                  {!form.isVerified && selectedId && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={verifyStudent.isPending || !selectedIdCardUrl}
                      title={
                        selectedIdCardUrl
                          ? "Approve uploaded student ID"
                          : "Student ID has not been uploaded"
                      }
                      onClick={() => {
                        if (selectedIdCardUrl) verifyStudent.mutate(selectedId);
                      }}
                    >
                      {verifyStudent.isPending ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      )}
                      Approve ID
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-faculty">Faculty</Label>
                <Select
                  key={faculties.isLoading ? "loading" : form.facultyId || NOT_SET}
                  value={form.facultyId || NOT_SET}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      facultyId: value === NOT_SET ? undefined : value,
                      departmentId: undefined,
                    })
                  }
                  disabled={faculties.isLoading}
                >
                  <SelectTrigger id="student-faculty" className="h-10">
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NOT_SET}>Not set</SelectItem>
                    {(faculties.data ?? []).map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-department">Department</Label>
                <Select
                  key={departments.isLoading ? "loading" : form.departmentId || NOT_SET}
                  value={form.departmentId || NOT_SET}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      departmentId: value === NOT_SET ? undefined : value,
                    })
                  }
                  disabled={!form.facultyId || departments.isLoading}
                >
                  <SelectTrigger id="student-department" className="h-10">
                    <SelectValue
                      placeholder={form.facultyId ? "Select department" : "Select a faculty first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NOT_SET}>Not set</SelectItem>
                    {(departments.data ?? []).map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-level">Level</Label>
                <Select
                  key={levels.isLoading ? "loading" : form.levelId || NOT_SET}
                  value={form.levelId || NOT_SET}
                  onValueChange={(value) =>
                    setForm({ ...form, levelId: value === NOT_SET ? undefined : value })
                  }
                  disabled={levels.isLoading}
                >
                  <SelectTrigger id="student-level" className="h-10">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NOT_SET}>Not set</SelectItem>
                    {(levels.data ?? []).map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="active">Voting account active</Label>
                <Switch
                  id="active"
                  checked={form.isActive ?? false}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="verified">Student verified</Label>
                <Switch
                  id="verified"
                  checked={form.isVerified ?? false}
                  disabled={!form.isVerified && !selectedIdCardUrl}
                  onCheckedChange={(checked) => setForm({ ...form, isVerified: checked })}
                />
              </div>
              <Button className="w-full" disabled={update.isPending}>
                {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save student
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
