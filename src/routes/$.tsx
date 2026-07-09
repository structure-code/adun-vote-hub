import { createFileRoute } from "@tanstack/react-router";
import { ClientApp } from "@/app/ClientApp";

// Catch-all: every URL falls through to the React Router DOM app so
// deep links like /login, /admin, /student/... all render correctly.
export const Route = createFileRoute("/$")({
  ssr: false,
  component: ClientApp,
});