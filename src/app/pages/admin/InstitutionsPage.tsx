import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { institutionsApi } from "@/api/institutions";
import type { Department, Faculty, Level } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Kind = "faculty" | "department" | "level";
type Record = Faculty | Department | Level;
type FormState = { name: string; description: string; facultyId: string };
const blank: FormState = { name: "", description: "", facultyId: "" };

export function InstitutionsPage() {
  const client = useQueryClient();
  const [kind, setKind] = useState<Kind>("faculty");
  const [editing, setEditing] = useState<Record | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const faculties = useQuery({
    queryKey: ["institutions", "faculties"],
    queryFn: institutionsApi.faculties.list,
  });
  const departments = useQuery({
    queryKey: ["institutions", "departments"],
    queryFn: () => institutionsApi.departments.list(),
  });
  const levels = useQuery({
    queryKey: ["institutions", "levels"],
    queryFn: institutionsApi.levels.list,
  });
  const facultyNames = new Map((faculties.data ?? []).map((faculty) => [faculty.id, faculty.name]));

  const save = useMutation({
    mutationFn: async () => {
      if (kind === "faculty")
        return editing
          ? institutionsApi.faculties.update(editing.id, {
              name: form.name,
              description: form.description || undefined,
            })
          : institutionsApi.faculties.create({
              name: form.name,
              description: form.description || undefined,
            });
      if (kind === "level")
        return editing
          ? institutionsApi.levels.update(editing.id, {
              name: form.name,
              description: form.description || undefined,
            })
          : institutionsApi.levels.create({
              name: form.name,
              description: form.description || undefined,
            });
      const dto = {
        name: form.name,
        description: form.description || undefined,
        facultyId: form.facultyId,
      };
      return editing
        ? institutionsApi.departments.update(editing.id, dto)
        : institutionsApi.departments.create(dto);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["institutions"] });
      toast.success(`${kind[0].toUpperCase()}${kind.slice(1)} saved`);
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: async ({ resourceKind, id }: { resourceKind: Kind; id: string }) => {
      if (resourceKind === "faculty") return institutionsApi.faculties.remove(id);
      if (resourceKind === "department") return institutionsApi.departments.remove(id);
      return institutionsApi.levels.remove(id);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["institutions"] });
      toast.success("Institution record deleted");
    },
  });

  function start(resourceKind: Kind, record?: Record) {
    setKind(resourceKind);
    setEditing(record ?? null);
    setForm(
      record
        ? {
            name: record.name,
            description: record.description ?? "",
            facultyId: "facultyId" in record ? record.facultyId : "",
          }
        : blank,
    );
    setOpen(true);
  }
  function panel(resourceKind: Kind, records: Record[] | undefined, loading: boolean) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => start(resourceKind)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {resourceKind}
          </Button>
        </div>
        {loading ? (
          <Skeleton className="h-44" />
        ) : (records ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No {resourceKind} records found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(records ?? []).map((record) => (
              <Card key={record.id}>
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold">{record.name}</h3>
                  {"facultyId" in record && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {facultyNames.get(record.facultyId) || record.facultyId}
                    </p>
                  )}
                  <p className="mt-3 min-h-10 text-sm text-muted-foreground">
                    {record.description || "No description"}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => start(resourceKind, record)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete ${record.name}?`))
                          remove.mutate({ resourceKind, id: record.id });
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Institution settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage the faculties, departments, and levels used by student profiles.
        </p>
      </div>
      <Tabs defaultValue="faculties">
        <TabsList>
          <TabsTrigger value="faculties">Faculties</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="levels">Levels</TabsTrigger>
        </TabsList>
        <TabsContent value="faculties" className="mt-5">
          {panel("faculty", faculties.data, faculties.isLoading)}
        </TabsContent>
        <TabsContent value="departments" className="mt-5">
          {panel("department", departments.data, departments.isLoading)}
        </TabsContent>
        <TabsContent value="levels" className="mt-5">
          {panel("level", levels.data, levels.isLoading)}
        </TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} {kind}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {kind === "department" && (
              <div className="space-y-2">
                <Label htmlFor="resource-faculty">Faculty</Label>
                <select
                  id="resource-faculty"
                  required
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.facultyId}
                  onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                >
                  <option value="">Select faculty</option>
                  {(faculties.data ?? []).map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resource-name">Name</Label>
              <Input
                id="resource-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button className="w-full" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save {kind}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
