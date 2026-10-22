import { createBrowserRouter } from "react-router";
import { RootLayout } from "@/app/layouts/RootLayout";
import { DevBoomPage } from "@/app/pages/DevBoomPage";
import { DevRacePage } from "@/app/pages/DevRacePage";
import { DevUiPage } from "@/app/pages/DevUiPage";
import { QuestionsPage } from "@/features/browse/QuestionsPage";
import { SearchPage } from "@/features/browse/SearchPage";
import { TagPage } from "@/features/browse/TagPage";
import { TagsPage } from "@/features/browse/TagsPage";
import { CategoryPage } from "@/features/catalog/CategoryPage";
import { EntryPage } from "@/features/catalog/EntryPage";
import { HomePage } from "@/features/catalog/HomePage";
import { SectionLayout } from "@/features/catalog/SectionLayout";
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
          { path: "questions", element: <QuestionsPage /> },
          { path: "tags", element: <TagsPage /> },
          { path: "tags/:tag", element: <TagPage /> },
          { path: "search", element: <SearchPage /> },
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
          // A section: the layout (side panel) stays mounted while the visitor moves between its list page and its entries.
          {
            path: ":category/:section",
            element: <SectionLayout />,
            children: [
              { index: true, element: <SectionPage /> },
              { path: ":entry", element: <EntryPage /> },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
