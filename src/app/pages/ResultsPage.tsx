import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Trophy } from "lucide-react";
import { electionsApi } from "@/api/elections";
import { resultsApi } from "@/api/results";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function ResultsPage({ audience = "admin" }: { audience?: "admin" | "student" }) {
  const [electionId, setElectionId] = useState("");
  const elections = useQuery({ queryKey: ["elections"], queryFn: electionsApi.list });

  useEffect(() => {
    if (!electionId && elections.data?.[0]) setElectionId(elections.data[0].id);
  }, [electionId, elections.data]);

  const results = useQuery({
    queryKey: ["results", electionId],
    queryFn: () => resultsApi.get(electionId),
    enabled: !!electionId,
    refetchInterval: audience === "admin" ? 15_000 : false,
  });

  // 1. Target the nested results array safely
  const positions = results.data?.results ?? [];

  // 2. Calculate the global total votes by summing unique position votes (or fallback to manual calculation)
  const totalVotesCounted = results.data?.totalVotes ?? positions.reduce((sum, pos) => sum + (pos.totalVotes || 0), 0);

  const electionTitle =
    results.data?.electionTitle || elections.data?.find((e) => e.id === electionId)?.title;
  const electionStatus =
    results.data?.status || elections.data?.find((e) => e.id === electionId)?.status;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Election results</h2>
        <p className="text-sm text-muted-foreground">
          {audience === "admin"
            ? "Live tallies refresh automatically every 15 seconds."
            : "View published election tallies and winners."}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="result-election">Election</Label>
            <Select
              value={electionId || undefined}
              onValueChange={setElectionId}
              disabled={elections.isLoading}
            >
              <SelectTrigger id="result-election" className="h-10 w-full sm:max-w-lg">
                <SelectValue placeholder="Select election" />
              </SelectTrigger>
              <SelectContent>
                {(elections.data ?? []).map((election) => (
                  <SelectItem key={election.id} value={election.id}>
                    {election.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {results.isLoading ? (
        <Skeleton className="h-64" />
      ) : results.isError ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            Results are not available for this election.
          </CardContent>
        </Card>
      ) : positions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center text-sm text-muted-foreground">
            <BarChart3 className="mb-3 h-7 w-7" />
            No votes have been tallied yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total votes
                </div>
                <div className="mt-1 font-display text-3xl font-bold">
                  {totalVotesCounted}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Positions reported
                </div>
                <div className="mt-1 font-display text-3xl font-bold">
                  {positions.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {electionTitle || electionStatus ? (
            <div className="space-y-1">
              {electionTitle && <div className="text-sm font-medium">{electionTitle}</div>}
              {electionStatus && (
                <div className="text-xs text-muted-foreground">Status: {electionStatus}</div>
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {/* 3. Map directly over the positions array provided by backend */}
            {positions.map((positionGroup) => {
              const candidatesList = positionGroup.candidates ?? [];
              
              // Find the highest vote count to correctly calibrate the progress bar max-values
              const maxVotes = Math.max(...candidatesList.map((c) => c.voteCount || 0), 0);

              return (
                <Card key={positionGroup.positionId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{positionGroup.positionTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {candidatesList
                      .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
                      .map((candidate) => {
                        // Safely pull the user objects from backend response
                        const displayName = candidate.user?.name || "Unknown Candidate";
                        const nickname = candidate.user?.nickname ? `"${candidate.user.nickname}"` : "";

                        return (
                          <div key={candidate.id}>
                            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                              <span className="flex min-w-0 items-center gap-2 font-medium">
                                {/* Highlight winner or top vote getter */}
                                {(candidate.isWinner || (candidate.voteCount === maxVotes && maxVotes > 0)) && (
                                  <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                                )}
                                <span className="truncate">
                                  {displayName} {nickname && <span className="text-xs text-muted-foreground font-normal">{nickname}</span>}
                                </span>
                              </span>
                              <Badge variant="outline">{candidate.voteCount} votes</Badge>
                            </div>
                            <Progress
                              value={
                                positionGroup.totalVotes 
                                  ? ((candidate.voteCount || 0) / positionGroup.totalVotes) * 100 
                                  : 0
                              }
                            />
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}