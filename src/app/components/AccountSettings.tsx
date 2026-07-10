import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usersApi } from "@/api/users";
import { useAuth } from "@/store/auth";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountSettings() {
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);
  const setUser = useAuth((state) => state.setUser);
  const clear = useAuth((state) => state.clear);
  const [email, setEmail] = useState(user?.email ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => setEmail(user?.email ?? ""), [user?.email]);

  const updateProfile = useMutation({
    mutationFn: () => usersApi.updateMe({ email }),
    onSuccess: (updatedUser) => {
      setUser({ ...user!, ...updatedUser, email: updatedUser.email ?? email });
      toast.success("Account profile updated");
    },
  });
  const changePassword = useMutation({
    mutationFn: () => usersApi.changePassword({ oldPassword, newPassword }),
    onSuccess: () => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    },
  });
  const deleteAccount = useMutation({
    mutationFn: usersApi.deleteMe,
    onSuccess: () => {
      clear();
      toast.success("Your account was deleted");
      navigate("/", { replace: true });
    },
  });

  function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    changePassword.mutate();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-4 w-4" /> Email address
          </CardTitle>
          <CardDescription>Update the email associated with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateProfile.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button disabled={updateProfile.isPending || email === user?.email}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LockKeyhole className="h-4 w-4" /> Change password
          </CardTitle>
          <CardDescription>Enter your current password before choosing a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitPassword}>
            <div className="space-y-2">
              <Label htmlFor="old-password">Current password</Label>
              <Input
                id="old-password"
                type="password"
                autoComplete="current-password"
                minLength={6}
                required
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
            <Button disabled={changePassword.isPending}>
              {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Delete account</CardTitle>
          <CardDescription>
            Permanently remove your user account. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your profile and access to the voting system will be removed. This cannot be
                  reversed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAccount.mutate()}
                  disabled={deleteAccount.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
