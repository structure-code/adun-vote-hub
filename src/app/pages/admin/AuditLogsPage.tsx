import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ScrollText } from "lucide-react";
import { auditLogsApi } from "@/api/audit-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuditLogsPage() {
  const logs = useQuery({ queryKey: ["audit-logs"], queryFn: auditLogsApi.list });
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Audit logs</h2>
          <p className="text-sm text-muted-foreground">
            Security-sensitive activity recorded by the voting service.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logs.refetch()}
          disabled={logs.isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${logs.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      {logs.isLoading ? (
        <Skeleton className="h-72" />
      ) : (logs.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-sm text-muted-foreground">
            <ScrollText className="mb-3 h-7 w-7" />
            No audit events found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Actor</th>
                  <th className="p-4 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(logs.data ?? []).map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap p-4 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">{log.action}</td>
                    <td className="p-4">
                      {log.actor?.email || log.actor?.matricNumber || log.actorId || "System"}
                    </td>
                    <td
                      className="max-w-md truncate p-4 font-mono text-xs text-muted-foreground"
                      title={log.metadata ? JSON.stringify(log.metadata) : undefined}
                    >
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
