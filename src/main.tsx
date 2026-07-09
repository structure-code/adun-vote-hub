import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { ClientApp } from "@/app/ClientApp";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ClientApp />
  </StrictMode>,
);
