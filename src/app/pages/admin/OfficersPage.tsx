import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usersApi } from "@/api/users";
import type { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function OfficersPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<User | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [foundOfficer, setFoundOfficer] = useState<User | null>(null);
  const create = useMutation({
    mutationFn: () => usersApi.createOfficer({ email, password, role: "ELECTION_OFFICER" }),
    onSuccess: (officer) => {
      setCreated(officer);
      setEmail("");
      setPassword("");
      toast.success("Election officer created");
    },
  });
  const searchOfficer = useMutation({
    mutationFn: usersApi.searchOfficer,
    onSuccess: setFoundOfficer,
  });
  const deleteOfficer = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      setFoundOfficer(null);
      toast.success("Election officer deleted");
    },
  });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Election officers</h2>
        <p className="text-sm text-muted-foreground">
          Provision an account for a member of the election team.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Find an officer</CardTitle>
            <CardDescription>Search for an election officer by their exact email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setFoundOfficer(null);
                searchOfficer.mutate(searchEmail.trim());
              }}
            >
              <Input
                type="email"
                placeholder="officer@example.com"
                required
                value={searchEmail}
                onChange={(event) => setSearchEmail(event.target.value)}
              />
              <Button disabled={searchOfficer.isPending}>
                {searchOfficer.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="sr-only">Search officer</span>
              </Button>
            </form>
            {foundOfficer ? (
              <div className="rounded-lg border p-4">
                <div className="font-medium">{foundOfficer.email}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {foundOfficer.role}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="mt-4" size="sm" variant="destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete officer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {foundOfficer.email}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The officer will immediately lose access. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteOfficer.mutate(foundOfficer.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete officer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Search results will appear here.</p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">New officer</CardTitle>
            <CardDescription>
              The officer will use these credentials on the admin sign-in page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="officer-email">Email</Label>
                <Input
                  id="officer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officer-password">Temporary password</Label>
                <Input
                  id="officer-password"
                  type="password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
                officer
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest provisioned account</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-52 items-center justify-center">
            {created ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck />
                </div>
                <div className="mt-3 font-medium">{created.email || email}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {created.role || "ELECTION_OFFICER"}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Newly created officer details will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
