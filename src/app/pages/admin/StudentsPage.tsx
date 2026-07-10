import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { institutionsApi } from "@/api/institutions";
import { studentsApi } from "@/api/students";
import { usersApi } from "@/api/users";
import { useAuth } from "@/store/auth";
import type { UpdateStudentProfileDto, User } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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

export function StudentsPage() {
  const client = useQueryClient();
  const isSuperAdmin = useAuth((state) => state.user?.role === "SUPER_ADMIN");
  const [search, setSearch] = useState("");
  const [searchedStudent, setSearchedStudent] = useState<User | null>(null);
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
    queryFn: () => institutionsApi.departments.list(form.facultyId),
    enabled: !!selectedId,
  });
  const levels = useQuery({
    queryKey: ["institutions", "levels"],
    queryFn: institutionsApi.levels.list,
  });

  useEffect(() => {
    if (!selected.data) return;
    setForm({
      facultyId: selected.data.facultyId,
      departmentId: selected.data.departmentId,
      levelId: selected.data.levelId,
      isActive: selected.data.isActive ?? true,
      isVerified: selected.data.isVerified ?? false,
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
  const deleteUser = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["students"] });
      setSearchedStudent(null);
      toast.success("Student account deleted");
    },
  });
  const displayedStudents = searchedStudent ? [searchedStudent] : (students.data ?? []);

  function label(student: User) {
    return student.matricNumber || student.email || student.id;
  }
  function departmentName(student: User) {
    return typeof student.department === "string"
      ? student.department
      : student.department?.name || student.departmentRecord?.name || student.departmentId;
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
            <Label htmlFor="student-search">Search students</Label>
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
                {displayedStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="p-4">
                      <div className="font-medium">{label(student)}</div>
                      <div className="text-xs text-muted-foreground">
                        {departmentName(student) || "Department not set"}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={student.isActive === false ? "destructive" : "outline"}>
                        {student.isActive === false ? "Inactive" : "Active"}
                      </Badge>
                    </td>
                    <td className="p-4">{student.isVerified ? "Yes" : "No"}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedId(student.id)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Manage
                        </Button>
                        {isSuperAdmin && (
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
                                  onClick={() => deleteUser.mutate(student.id)}
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
                ))}
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
              <div className="space-y-2">
                <Label>Faculty</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.facultyId ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      facultyId: e.target.value || undefined,
                      departmentId: undefined,
                    })
                  }
                >
                  <option value="">Not set</option>
                  {(faculties.data ?? []).map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.departmentId ?? ""}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value || undefined })}
                >
                  <option value="">Not set</option>
                  {(departments.data ?? []).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.levelId ?? ""}
                  onChange={(e) => setForm({ ...form, levelId: e.target.value || undefined })}
                >
                  <option value="">Not set</option>
                  {(levels.data ?? []).map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
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
