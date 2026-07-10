import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/app/components/BrandLogo";
import { useAuth } from "@/store/auth";
import logo from "@/assets/adun-logo.png";

const trustPoints = [
  {
    title: "Verified students",
    description: "Student access is tied to matric number identity before any ballot is cast.",
    icon: UserCheck,
  },
  {
    title: "Protected ballots",
    description:
      "The voting flow is designed for secure, private participation in campus elections.",
    icon: LockKeyhole,
  },
  {
    title: "Auditable process",
    description:
      "Administrators can monitor elections, candidates, students, results, and audit logs.",
    icon: ClipboardCheck,
  },
];

const workflow = [
  "Create or sign in to a student account",
  "View active university elections",
  "Cast one secure vote per eligible contest",
  "Follow published results after elections close",
];

export function LandingPage() {
  const hydrated = useAuth((s) => s.hydrated);
  const authenticated = useAuth((s) => s.authenticated);
  const user = useAuth((s) => s.user);
  const isAdmin =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "ELECTION_OFFICER";
  const dashboardPath = isAdmin ? "/admin" : "/student";
  const isSignedIn = hydrated && authenticated;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="ADUN E-Voting home">
            <BrandLogo size={44} />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#integrity" className="hover:text-foreground">
              Integrity
            </a>
            <a href="#workflow" className="hover:text-foreground">
              Voting flow
            </a>
            <a href="#administration" className="hover:text-foreground">
              Administration
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login/student">Student sign in</Link>
            </Button>
            <Button asChild>
              <Link to={isSignedIn ? dashboardPath : "/register"}>
                {isSignedIn ? "Open dashboard" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b bg-[linear-gradient(120deg,oklch(0.18_0.05_265)_0%,oklch(0.28_0.09_265)_58%,oklch(0.42_0.08_230)_100%)] text-white">
          <div className="absolute inset-0 -z-10 opacity-20">
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,white_0_1px,transparent_1px)] bg-[length:34px_34px]" />
          </div>
          <img
            src={logo}
            alt=""
            className="absolute right-[-6rem] top-16 -z-10 h-[26rem] w-[26rem] object-contain opacity-10 sm:right-8 lg:h-[34rem] lg:w-[34rem]"
          />
          <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl content-center gap-10 px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                Admiralty University of Nigeria
              </div>
              <h1 className="mt-6 max-w-4xl font-display text-4xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                ADUN E-Voting System
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
                A secure digital voting platform for university elections, built to help students
                participate confidently and help election officers manage transparent campus polls.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                  <Link to={isSignedIn ? dashboardPath : "/register"}>
                    {isSignedIn ? "Continue to dashboard" : "Register to vote"}
                    <Vote className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-navy"
                >
                  <Link to="/login/student">
                    Student sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:max-w-4xl">
              {(
                [
                  ["Active elections", "Live student ballot access", Vote],
                  ["Election officers", "Role-based administration", UserCheck],
                  ["Results center", "Clear reporting after polls", BarChart3],
                ] as const
              ).map(([title, detail, Icon]) => (
                <div
                  key={title as string}
                  className="rounded-lg border border-white/16 bg-white/10 p-4 backdrop-blur"
                >
                  <Icon className="h-5 w-5 text-gold" />
                  <div className="mt-4 font-display text-lg font-bold">{title}</div>
                  <p className="mt-1 text-sm text-white/72">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="integrity" className="border-b py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold uppercase tracking-widest text-primary">
                Election integrity
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                Built around trust, eligibility, and accountability.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {trustPoints.map((item) => (
                <article key={item.title} className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b bg-secondary/60 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <div className="text-sm font-semibold uppercase tracking-widest text-primary">
                Student voting flow
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                A focused path from sign-in to submitted vote.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Students get a simple dashboard for current elections, while the platform keeps
                sensitive election actions behind authenticated access.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="rounded-md bg-primary p-5 text-primary-foreground">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest opacity-75">
                      Student dashboard
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold">Active elections</div>
                  </div>
                  <Vote className="h-8 w-8 text-gold" />
                </div>
              </div>
              <ol className="mt-4 space-y-3">
                {workflow.map((item, index) => (
                  <li key={item} className="flex items-start gap-3 rounded-md border p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-gold-foreground">
                      {index + 1}
                    </div>
                    <div className="pt-0.5 text-sm font-medium">{item}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="administration" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <div className="text-sm font-semibold uppercase tracking-widest text-primary">
                  Election management
                </div>
                <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                  Tools for admins, officers, candidates, students, and results.
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  The administrative dashboard centralizes the operational pieces of campus
                  elections, from setup and participation to result review.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link to="/login/admin">Admin sign in</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/register">Student registration</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {["Elections", "Positions", "Candidates", "Students", "Results", "Audit logs"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg border bg-card p-4"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm font-semibold">{item}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-navy py-6 text-navy-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo size={36} className="text-navy-foreground [&_*]:text-navy-foreground" />
          <div className="text-white/70">Admiralty University of Nigeria E-Voting System</div>
        </div>
      </footer>
    </div>
  );
}
