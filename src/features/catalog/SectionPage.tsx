import { useCallback, useMemo } from "react";
import { useOutletContext } from "react-router";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { getEntries } from "@/features/catalog/api";
import { EntryFilters } from "@/features/catalog/EntryFilters";
import { EntryResults } from "@/features/catalog/EntryResults";
import { PAGE_SIZE, useListParams } from "@/features/catalog/list-params";
import type { SectionContext } from "@/features/catalog/SectionLayout";
import { isNotFound } from "@/shared/api/not-found";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { KindBadge } from "@/shared/ui/KindBadge";

/**
 * SECTION LIST PAGE: /:category/:section, for example /react/interview-questions
 *
 * This file is only the RIGHT-HAND part of the screen. The left-hand side panel (the entry titles under their
 * headings) belongs to SectionLayout.tsx, which wraps this page and stays mounted while you move between entries.
 *
 *   SectionLayout.tsx                      this file (SectionPage.tsx)
 *   +-----------------+-----------------------------------------------+
 *   | SIDE PANEL      | 1. HEADER      breadcrumbs, title, description |
 *   | (SectionNav)    | 2. FILTER BAR  difficulty buttons, search box  |
 *   |                 | 3. ENTRY LIST  one card per entry (a page)     |
 *   |                 | 4. PAGER       Previous 1 2 3 Next             |
 *   +-----------------+-----------------------------------------------+
 *
 * Where each piece of data comes from:
 * - the topic and the section (name, description, kind): from SectionLayout, through the outlet context;
 * - page, difficulty and search: from the URL (list-params.ts), so a link or a refresh shows the same list;
 * - the entries of the current page: loaded here with useFetch; the list, states and pager are drawn by EntryResults.
 */

export function SectionPage() {
  useRenderCount("SectionPage");

  // ---------------------------------------------------------------------------------------------
  // DATA: what this page needs before it can draw anything
  // ---------------------------------------------------------------------------------------------

  // The topic (for example React) and the section (for example Interview Questions), already loaded by SectionLayout.
  const { category, section } = useOutletContext<SectionContext>();

  // The current page, difficulty and search text, read from the URL. `to(...)` makes a link, `change(...)` changes the URL.
  const { page, difficulty, search, to, change } = useListParams();
  // The pager's link builder. The same function until the URL changes, so the memoised Pagination can skip other renders.
  const pageLink = useCallback((next: number) => to({ page: next }), [to]);
  const clearLink = useMemo(() => to({ difficulty: undefined, search: "" }), [to]);

  // One page of entries. Runs again whenever the section, the page or a filter changes.
  const entries = useFetch((signal) => getEntries(category.slug, section.slug, { page, limit: PAGE_SIZE, difficulty, search }, signal), [category.slug, section.slug, page, difficulty, search]);

  // ---------------------------------------------------------------------------------------------
  // WHOLE-PAGE STATES: nothing to draw
  // ---------------------------------------------------------------------------------------------

  const missing = isNotFound(entries);
  useDocumentTitle(missing ? "Page not found" : `${section.name} · ${category.name}`);

  if (missing) return <NotFoundPage />;

  const filtered = difficulty !== undefined || search.trim() !== ""; // is any filter on?

  return (
    <div className="space-y-6">
      {/* ===== 1. HEADER: breadcrumbs, section title, kind badge, description ===== */}
      <header className="space-y-2">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: category.name, to: `/${category.slug}` }, { label: section.name }]} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{section.name}</h1>
          <KindBadge kind={section.kind} />
        </div>
        {section.description && <p className="max-w-2xl text-muted">{section.description}</p>}
      </header>

      {/* ===== 2 to 4. FILTER BAR, ENTRY LIST and PAGER: shared with the Questions and Tag pages (EntryResults.tsx) ===== */}
      <EntryResults
        entries={entries}
        scope={`${category.slug}/${section.slug}`}
        pageLink={pageLink}
        clearTo={clearLink}
        filtered={filtered}
        emptyText="This section has no published entries yet."
        filters={<EntryFilters difficulty={difficulty} search={search} onDifficulty={(value) => change({ difficulty: value })} onSearch={(value) => change({ search: value }, { replace: true })} />}
      />
    </div>
  );
}
