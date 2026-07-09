import { createFileRoute } from "@tanstack/react-router";
import { ClientApp } from "@/app/ClientApp";

export const Route = createFileRoute("/")({
  ssr: false,
  component: ClientApp,
});
