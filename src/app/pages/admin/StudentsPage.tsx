import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { institutionsApi } from "@/api/institutions";
import { studentsApi } from "@/api/students";
import type { UpdateStudentProfileDto, User } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export function StudentsPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
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
  const filtered = (students.data ?? []).filter((student) =>
    `${student.matricNumber ?? ""} ${student.email ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

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
          <div className="space-y-2">
            <Label htmlFor="student-search">Search students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="student-search"
                className="pl-9"
                placeholder="Matric number or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
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
      {students.isLoading ? (
        <Skeleton className="h-60" />
      ) : filtered.length === 0 ? (
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
                {filtered.map((student) => (
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
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(student.id)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Manage
                      </Button>
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
