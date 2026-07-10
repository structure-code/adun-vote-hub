import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePage() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: authApi.me });
  if (profile.isLoading) return <Skeleton className="h-64" />;
  const user = profile.data;
  const institutionName = (value: { name?: string } | string | undefined, fallback?: string) =>
    typeof value === "string" ? value : value?.name || fallback;
  const rows = [
    ["Matric number", user?.matricNumber],
    ["Email", user?.email],
    ["Role", user?.role],
    ["Faculty", institutionName(user?.faculty, user?.facultyRecord?.name || user?.facultyId)],
    [
      "Department",
      institutionName(user?.department, user?.departmentRecord?.name || user?.departmentId),
    ],
    ["Level", institutionName(user?.level, user?.levelRecord?.name || user?.levelId)],
    ["Account active", user?.isActive === false ? "No" : "Yes"],
    ["Verified", user?.isVerified ? "Yes" : "No"],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your student and voting eligibility information.
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Account details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-3 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="break-words font-medium">{value || "Not set"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
