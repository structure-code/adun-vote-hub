import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Vote,
  Users,
  UserCog,
  Award,
  ClipboardList,
  Trophy,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/app/components/BrandLogo";
import { useAuth } from "@/store/auth";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles?: string[];
};

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/elections", label: "Elections", icon: Vote },
  { to: "/admin/positions", label: "Positions", icon: Award },
  { to: "/admin/candidates", label: "Candidates", icon: ClipboardList },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/officers", label: "Officers", icon: UserCog, roles: ["SUPER_ADMIN"] },
  { to: "/admin/results", label: "Results", icon: Trophy },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText, roles: ["SUPER_ADMIN"] },
  { to: "/admin/settings", label: "Settings", icon: Settings, roles: ["SUPER_ADMIN"] },
];

const studentNav: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/elections", label: "Elections", icon: Vote },
  { to: "/student/results", label: "Results", icon: Trophy },
  { to: "/student/profile", label: "Profile", icon: User },
];

export function AppShell({ nav, title }: { nav: NavItem[]; title: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const visibleNav = nav.filter((item) => !item.roles || item.roles.includes(user?.role ?? ""));

  const initials = (user?.matricNumber || user?.email || "U")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    try {
      await authApi.logout().catch(() => null);
    } finally {
      const loginPath =
        user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "ELECTION_OFFICER"
          ? "/login/admin"
          : "/login/student";
      clear();
      toast.success("Signed out");
      navigate(loginPath, { replace: true });
    }
  }

  const SideNav = (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="border-b p-5">
        <BrandLogo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin" || item.to === "/student"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        © ADUN E-Voting
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <div className="hidden md:block">{SideNav}</div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {SideNav}
              </SheetContent>
            </Sheet>
            <h1 className="truncate font-display text-lg font-semibold sm:text-xl">{title}</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border bg-card p-1 pr-3 text-sm shadow-sm transition hover:bg-accent/10">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[10rem] truncate text-left sm:block">
                  {user?.email || user?.matricNumber || "Account"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {user?.email || user?.matricNumber}
                <div className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground">
                  {user?.role}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(visibleNav[0]?.to ?? "/")}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return <AppShell nav={adminNav} title="Admin Console" />;
}
export function StudentLayout() {
  return <AppShell nav={studentNav} title="Student Portal" />;
}
