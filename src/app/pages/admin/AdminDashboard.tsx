import { useQuery } from "@tanstack/react-query";
import { Vote, Users, ClipboardList, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { electionsApi } from "@/api/elections";
import { candidatesApi } from "@/api/candidates";
import { studentsApi } from "@/api/students";
import type { Election } from "@/types/api";

function statusVariant(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "ONGOING":
      return "default" as const;
    case "ENDED":
      return "secondary" as const;
    case "SCHEDULED":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export function AdminDashboard() {
  const elections = useQuery({ queryKey: ["elections"], queryFn: electionsApi.list });
  const candidates = useQuery({ queryKey: ["candidates"], queryFn: candidatesApi.list });
  const students = useQuery({ queryKey: ["students"], queryFn: studentsApi.list });

  const activeCount = (elections.data ?? []).filter(
    (e) => (e.status || "").toUpperCase() === "ONGOING",
  ).length;
  const closedCount = (elections.data ?? []).filter(
    (e) => (e.status || "").toUpperCase() === "ENDED",
  ).length;

  const stats = [
    {
      label: "Total Elections",
      value: elections.data?.length,
      icon: Vote,
      loading: elections.isLoading,
    },
    { label: "Active Elections", value: activeCount, icon: Trophy, loading: elections.isLoading },
    {
      label: "Candidates",
      value: candidates.data?.length,
      icon: ClipboardList,
      loading: candidates.isLoading,
    },
    { label: "Students", value: students.data?.length, icon: Users, loading: students.isLoading },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Overview</h2>
        <p className="text-sm text-muted-foreground">Live snapshot of the ADUN E-Voting system.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </div>
                  {s.loading ? (
                    <Skeleton className="mt-2 h-8 w-16" />
                  ) : (
                    <div className="mt-1 font-display text-3xl font-bold">{s.value ?? 0}</div>
                  )}
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">
            Recent elections <span className="text-muted-foreground">· {closedCount} closed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {elections.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (elections.data ?? []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No elections yet. Create one from the Elections page.
            </div>
          ) : (
            <ul className="divide-y">
              {(elections.data ?? []).slice(0, 6).map((e: Election) => (
                <li
                  key={e.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{e.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {new Date(e.startDate).toLocaleDateString()} —{" "}
                      {new Date(e.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={statusVariant(e.status)}>{e.status || "DRAFT"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
