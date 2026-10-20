import { createBrowserRouter } from "react-router";
import { RootLayout } from "@/app/layouts/RootLayout";
import { DevBoomPage } from "@/app/pages/DevBoomPage";
import { DevRacePage } from "@/app/pages/DevRacePage";
import { DevUiPage } from "@/app/pages/DevUiPage";
import { CategoryPage } from "@/features/catalog/CategoryPage";
import { HomePage } from "@/features/catalog/HomePage";
import { SectionPage } from "@/features/catalog/SectionPage";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { PlaceholderPage } from "@/app/pages/PlaceholderPage";
import { RouteError } from "@/app/RouteError";

/**
 * The route tree. Two error elements on purpose:
 * - the layout route's errorElement catches errors in the layout itself (the whole screen is replaced);
 * - the pathless route inside it catches errors in a PAGE, so the header and footer stay on screen.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "questions", element: <PlaceholderPage title="Questions" module="M4" /> },
          { path: "tags", element: <PlaceholderPage title="Tags" module="M4" /> },
          { path: "search", element: <PlaceholderPage title="Search" module="M5" /> },
          // Development-only pages: a crash test, the race condition demo and the UI components.
          ...(import.meta.env.DEV
            ? [
                { path: "dev/boom", element: <DevBoomPage /> },
                { path: "dev/race", element: <DevRacePage /> },
                { path: "dev/ui", element: <DevUiPage /> },
              ]
            : []),
          // A topic and its sections. Static routes above (questions, tags, search, dev/...) win over these dynamic ones.
          { path: ":category", element: <CategoryPage /> },
          { path: ":category/:section", element: <SectionPage /> },
          { path: ":category/:section/:entry", element: <PlaceholderPage title="Entry" module="M3" /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
