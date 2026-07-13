import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, Vote } from "lucide-react";
import { electionsApi } from "@/api/elections";
import { positiveStatusBadgeClass } from "@/lib/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentElectionsPage() {
  const elections = useQuery({ queryKey: ["elections"], queryFn: electionsApi.list });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Elections</h2>
        <p className="text-sm text-muted-foreground">Browse current and past ADUN elections.</p>
      </div>
      {elections.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <Skeleton key={n} className="h-44" />
          ))}
        </div>
      ) : (elections.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-sm text-muted-foreground">
            <Vote className="mb-3 h-7 w-7" />
            No elections are available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(elections.data ?? []).map((election) => {
            const ongoing = election.status?.toUpperCase() === "ONGOING";
            return (
              <Card key={election.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-semibold">{election.title}</h3>
                    <Badge
                      variant={ongoing ? "default" : "outline"}
                      className={ongoing ? positiveStatusBadgeClass : undefined}
                    >
                      {election.status}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Starts {new Date(election.startDate).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Ends {new Date(election.endDate).toLocaleString()}
                    </div>
                  </div>
                  {ongoing && (
                    <Button asChild className="mt-5 w-full">
                      <Link to={`/student/vote/${election.id}`}>Open ballot</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
