import { AccountSettings } from "@/app/components/AccountSettings";

export function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Account settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your email, password, and account lifecycle.
        </p>
      </div>
      <AccountSettings />
    </div>
  );
}
