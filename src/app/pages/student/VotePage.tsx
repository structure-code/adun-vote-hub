import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { candidatesApi } from "@/api/candidates";
import { electionsApi } from "@/api/elections";
import { positionsApi } from "@/api/positions";
import { votingApi } from "@/api/voting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function VotePage() {
  const { electionId = "" } = useParams();
  const navigate = useNavigate();
  const [choices, setChoices] = useState<Record<string, string>>({});
  const election = useQuery({
    queryKey: ["elections", electionId],
    queryFn: () => electionsApi.get(electionId),
    enabled: !!electionId,
  });
  const positions = useQuery({
    queryKey: ["positions", electionId],
    queryFn: () => positionsApi.list(electionId),
    enabled: !!electionId,
  });
  const candidates = useQuery({ queryKey: ["candidates"], queryFn: candidatesApi.list });
  const submit = useMutation({
    mutationFn: async () => {
      for (const [positionId, candidateId] of Object.entries(choices))
        await votingApi.cast({ electionId, positionId, candidateId });
    },
    onSuccess: () => {
      toast.success("Your ballot was submitted securely");
      navigate("/student/results", { replace: true });
    },
  });
  const isLoading = election.isLoading || positions.isLoading || candidates.isLoading;
  const eligibleCandidates = (positionId: string) =>
    (candidates.data ?? []).filter(
      (candidate) => candidate.positionId === positionId && candidate.isApproved !== false,
    );
  const canSubmit =
    (positions.data ?? []).length > 0 &&
    (positions.data ?? []).every((position) => !!choices[position.id]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!election.data || election.data.status?.toUpperCase() !== "ONGOING")
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          This election is not currently open for voting.
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{election.data.title}</h2>
        <p className="text-sm text-muted-foreground">
          Select one approved candidate for every position, then submit your ballot.
        </p>
      </div>
      {(positions.data ?? []).map((position) => (
        <Card key={position.id}>
          <CardHeader>
            <CardTitle className="text-lg">{position.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {eligibleCandidates(position.id).map((candidate) => {
                const selected = choices[position.id] === candidate.id;
                return (
                  <button
                    type="button"
                    key={candidate.id}
                    onClick={() => setChoices({ ...choices, [position.id]: candidate.id })}
                    className={cn(
                      "relative rounded-lg border p-4 text-left transition hover:border-primary",
                      selected && "border-primary bg-primary/5 ring-2 ring-primary/20",
                    )}
                  >
                    <div className="flex items-center gap-3">
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
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {candidate.user?.matricNumber || candidate.user?.email || "Candidate"}
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {candidate.manifesto || "No manifesto"}
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
              {eligibleCandidates(position.id).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No approved candidates are available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="sticky bottom-4 shadow-lg">
        <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>
              {Object.keys(choices).length} of {(positions.data ?? []).length} positions selected
            </span>
          </div>
          <Button disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit ballot
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
