import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Trophy } from "lucide-react";
import { electionsApi } from "@/api/elections";
import { resultsApi } from "@/api/results";
import type { VoteResult } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  const rows: VoteResult[] = results.data?.results ?? [];
  const grouped = rows.reduce<Record<string, VoteResult[]>>((acc, row) => {
    const key = row.positionTitle || row.positionId || "Results";
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  // Compute total votes across all positions (sum of all candidate votes)
  const totalVotesComputed = Object.values(grouped).reduce(
    (acc, candidates) => acc + candidates.reduce((s, c) => s + (c.votes ?? 0), 0),
    0,
  );

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
          <Label htmlFor="result-election">Election</Label>
          <select
            id="result-election"
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm sm:max-w-lg"
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
          >
            <option value="">Select election</option>
            {(elections.data ?? []).map((election) => (
              <option key={election.id} value={election.id}>
                {election.title}
              </option>
            ))}
          </select>
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
      ) : rows.length === 0 ? (
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
                  {results.data?.totalVotes ?? totalVotesComputed}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Positions reported
                </div>
                <div className="mt-1 font-display text-3xl font-bold">
                  {Object.keys(grouped).length}
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
            {Object.entries(grouped).map(([position, candidates]) => {
              const max = Math.max(...candidates.map((candidate) => candidate.votes));
              return (
                <Card key={position}>
                  <CardHeader>
                    <CardTitle className="text-lg">{position}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {candidates
                      .sort((a, b) => b.votes - a.votes)
                      .map((candidate) => (
                        <div key={candidate.candidateId}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-center gap-2 font-medium">
                              {candidate.votes === max && (
                                <Trophy className="h-4 w-4 text-accent" />
                              )}
                              <span className="truncate">
                                {candidate.candidateName || candidate.candidateId}
                              </span>
                            </span>
                            <Badge variant="outline">{candidate.votes} votes</Badge>
                          </div>
                          <Progress
                            value={
                              candidate.percentage ?? (max ? (candidate.votes / max) * 100 : 0)
                            }
                          />
                        </div>
                      ))}
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
