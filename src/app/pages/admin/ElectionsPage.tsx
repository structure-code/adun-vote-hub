import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { electionsApi } from "@/api/elections";
import { positiveStatusBadgeClass } from "@/lib/status-badges";
import type { CreateElectionDto, Election } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const emptyForm: CreateElectionDto = { title: "", startDate: "", endDate: "", status: "DRAFT" };

function toInputDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function electionStatusClass(status?: string) {
  return (status || "").toUpperCase() === "ONGOING" ? positiveStatusBadgeClass : undefined;
}

export function ElectionsPage() {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Election | null>(null);
  const [form, setForm] = useState<CreateElectionDto>(emptyForm);
  const elections = useQuery({ queryKey: ["elections"], queryFn: electionsApi.list });

  const save = useMutation({
    mutationFn: () => {
      const dto = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      return editing ? electionsApi.update(editing.id, dto) : electionsApi.create(dto);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["elections"] });
      toast.success(editing ? "Election updated" : "Election created");
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: electionsApi.remove,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["elections"] });
      toast.success("Election deleted");
    },
  });

  function beginCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function beginEdit(election: Election) {
    setEditing(election);
    setForm({
      title: election.title,
      startDate: toInputDate(election.startDate),
      endDate: toInputDate(election.endDate),
      status: election.status,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Elections</h2>
          <p className="text-sm text-muted-foreground">
            Create, schedule, and manage election lifecycles.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={beginCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New election
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit election" : "Create election"}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="election-title">Title</Label>
                <Input
                  id="election-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Starts</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Ends</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status || "DRAFT"}
                  onValueChange={(status) => setForm({ ...form, status })}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["DRAFT", "SCHEDULED", "ONGOING", "ENDED", "ARCHIVED"].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create election"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {elections.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20" />
          ))}
        </div>
      ) : (elections.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No elections have been created.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(elections.data ?? []).map((election) => (
            <Card key={election.id}>
              <CardContent className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold">{election.title}</h3>
                    <Badge variant="outline" className={electionStatusClass(election.status)}>
                      {election.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(election.startDate).toLocaleString()} —{" "}
                    {new Date(election.endDate).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => beginEdit(election)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete ${election.title}?`)) remove.mutate(election.id);
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
