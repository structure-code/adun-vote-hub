import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, Trash2, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import { candidatesApi } from "@/api/candidates";
import { positionsApi } from "@/api/positions";
import { studentsApi } from "@/api/students";
import { positiveStatusBadgeClass } from "@/lib/status-badges";
import type { StudentRecord } from "@/types/api";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";

type CandidateForm = {
  matricNumber: string;
  positionId: string;
  manifesto: string;
  picture?: File;
};

const blank: CandidateForm = { matricNumber: "", positionId: "", manifesto: "" };

function studentUserId(student: StudentRecord) {
  return (
    student.userId ||
    student.user?.id ||
    student.studentProfile?.user?.id ||
    (student.role === "STUDENT" ? student.id : undefined)
  );
}

export function CandidatesPage() {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CandidateForm>(blank);
  const candidates = useQuery({ queryKey: ["candidates"], queryFn: candidatesApi.list });
  const positions = useQuery({ queryKey: ["positions"], queryFn: () => positionsApi.list() });
  const positionNames = new Map(
    (positions.data ?? []).map((position) => [position.id, position.title]),
  );

  const create = useMutation({
    mutationFn: async () => {
      const student = await studentsApi.search(form.matricNumber.trim());
      const userId = studentUserId(student);
      if (!userId) throw new Error("The student search result did not include a user account.");
      return candidatesApi.create({
        userId,
        positionId: form.positionId,
        manifesto: form.manifesto || undefined,
        picture: form.picture,
      });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate created");
      setOpen(false);
      setForm(blank);
    },
    onError: (error) => {
      if (error.message.includes("did not include")) toast.error(error.message);
    },
  });
  const approve = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      candidatesApi.update(id, { isApproved }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate status updated");
    },
  });
  const remove = useMutation({
    mutationFn: candidatesApi.remove,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Candidates</h2>
          <p className="text-sm text-muted-foreground">
            Nominate students by matric number, review manifestos, and control approvals.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add candidate
        </Button>
      </div>

      {candidates.isLoading ? (
        <Skeleton className="h-52" />
      ) : (candidates.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No candidates found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(candidates.data ?? []).map((candidate) => (
            <Card key={candidate.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {candidate.pictureUrl || candidate.picture ? (
                    <img
                      src={candidate.pictureUrl || candidate.picture}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <UserRound className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {candidate.user?.studentProfile?.name} (
                      {candidate?.user?.studentProfile?.nickname})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {candidate.position?.title ||
                        positionNames.get(candidate.positionId) ||
                        "Position unavailable"}
                    </div>
                  </div>
                  <Badge
                    variant={candidate.isApproved ? "default" : "outline"}
                    className={candidate.isApproved ? positiveStatusBadgeClass : undefined}
                  >
                    {candidate.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <p className="mt-4 line-clamp-3 min-h-14 text-sm text-muted-foreground">
                  {candidate.manifesto || "No manifesto provided."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={approve.isPending}
                    onClick={() =>
                      approve.mutate({ id: candidate.id, isApproved: !candidate.isApproved })
                    }
                  >
                    {candidate.isApproved ? (
                      <XCircle className="mr-2 h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    )}
                    {candidate.isApproved ? "Disapprove" : "Approve"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this candidate?</AlertDialogTitle>
                        <AlertDialogDescription>
                          The candidate will be removed from their position. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => remove.mutate(candidate.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete candidate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add candidate</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="candidate-matric-number">Student matric number</Label>
              <Input
                id="candidate-matric-number"
                required
                placeholder="ADUN/FS/SEN/22/036"
                value={form.matricNumber}
                onChange={(event) => setForm({ ...form, matricNumber: event.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The matric number is resolved securely to the backend user account.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-position">Position</Label>
              <Select
                value={form.positionId || undefined}
                onValueChange={(positionId) => setForm({ ...form, positionId })}
              >
                <SelectTrigger id="candidate-position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {(positions.data ?? []).map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manifesto">Manifesto</Label>
              <Textarea
                id="manifesto"
                value={form.manifesto}
                onChange={(event) => setForm({ ...form, manifesto: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="picture">Picture</Label>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={(event) => setForm({ ...form, picture: event.target.files?.[0] })}
              />
            </div>
            <Button
              className="w-full"
              disabled={create.isPending || !form.positionId || !form.matricNumber.trim()}
            >
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create candidate
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
