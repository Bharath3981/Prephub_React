import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import "./index.css";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { ErrorMessage } from "@/app/ErrorMessage";
import { router } from "@/app/router";
// Importing the store runs its setup (it applies the saved theme and starts listening for changes).
import "@/shared/lib/theme-store";

createRoot(document.getElementById("root")!).render(
  // The last safety net: catches errors the router cannot (for example in the router setup itself).
  // Strict Mode is not used here, so a component renders and runs its effects once in development, as in production.
  <ErrorBoundary fallback={(error, reset) => <ErrorMessage error={error} onRetry={reset} />}>
    <RouterProvider router={router} />
  </ErrorBoundary>,
);
