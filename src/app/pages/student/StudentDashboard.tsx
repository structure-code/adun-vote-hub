import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Vote, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { electionsApi } from "@/api/elections";
import { positiveStatusBadgeClass } from "@/lib/status-badges";
import { useAuth } from "@/store/auth";

export function StudentDashboard() {
  const user = useAuth((s) => s.user);
  const elections = useQuery({ queryKey: ["elections"], queryFn: electionsApi.list });

  const active = (elections.data ?? []).filter((e) => (e.status || "").toUpperCase() === "ONGOING");

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="text-xs uppercase tracking-widest opacity-80">Welcome</div>
        <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
          {user?.matricNumber || "Student"}
        </h2>
        <p className="mt-2 max-w-xl text-sm opacity-90">
          Cast your vote securely in ongoing ADUN elections. Every vote is encrypted and auditable.
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Active elections</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/student/elections">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {elections.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Vote className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No active elections right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {active.map((e) => (
              <Card key={e.id} className="transition hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base">{e.title}</CardTitle>
                    <Badge className={positiveStatusBadgeClass}>{e.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Ends {new Date(e.endDate).toLocaleString()}
                  </div>
                  <Button asChild className="w-full">
                    <Link to={`/student/vote/${e.id}`}>Vote now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
