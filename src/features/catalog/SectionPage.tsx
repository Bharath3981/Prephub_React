import { useCallback, useEffect, useRef } from "react";
import { Link, useOutletContext } from "react-router";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { getEntries } from "@/features/catalog/api";
import { EntryFilters } from "@/features/catalog/EntryFilters";
import { EntryRow } from "@/features/catalog/EntryRow";
import { PAGE_SIZE, useListParams } from "@/features/catalog/list-params";
import type { SectionContext } from "@/features/catalog/SectionLayout";
import { isNotFound } from "@/shared/api/not-found";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { useKeepPrevious } from "@/shared/hooks/useKeepPrevious";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ErrorState } from "@/shared/ui/ErrorState";
import { KindBadge } from "@/shared/ui/KindBadge";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";

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
 * - the entries of the current page: loaded here with useFetch.
 */

/** Grey placeholder cards shown the very first time the list loads (before there is any list to show). */
function EntryListSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading entries...</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

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

  // One page of entries. Runs again whenever the section, the page or a filter changes.
  const entries = useFetch((signal) => getEntries(category.slug, section.slug, { page, limit: PAGE_SIZE, difficulty, search }, signal), [category.slug, section.slug, page, difficulty, search]);

  // While the next page loads, keep showing the current one (dimmed) instead of flashing a skeleton.
  const shown = useKeepPrevious(entries, `${category.slug}/${section.slug}`);

  // ---------------------------------------------------------------------------------------------
  // BEHAVIOUR: scroll to the top of the list after a page change
  // ---------------------------------------------------------------------------------------------

  // The pager is at the bottom of the page, so without this the new page would start out of sight.
  const listTop = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false; // do not scroll when the page first opens
      return;
    }
    listTop.current?.scrollIntoView({ block: "start" });
  }, [page]);

  // ---------------------------------------------------------------------------------------------
  // WHOLE-PAGE STATES: nothing to draw
  // ---------------------------------------------------------------------------------------------

  const missing = isNotFound(entries);
  useDocumentTitle(missing ? "Page not found" : `${section.name} · ${category.name}`);

  if (missing) return <NotFoundPage />;

  // ---------------------------------------------------------------------------------------------
  // VALUES FOR THE SCREEN
  // ---------------------------------------------------------------------------------------------

  const list = shown.data?.entries; // the cards to draw (undefined until the first load finishes)
  const meta = shown.data?.meta; // page, limit, total, totalPages
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

      {/* ===== 2. FILTER BAR: difficulty buttons, search box, and the "Showing 1 to 20 of 45" line ===== */}
      {/* listTop is the spot we scroll to after a page change. */}
      <div ref={listTop} className="scroll-mt-20 space-y-2">
        <EntryFilters difficulty={difficulty} search={search} onDifficulty={(value) => change({ difficulty: value })} onSearch={(value) => change({ search: value }, { replace: true })} />
        {meta && list && list.length > 0 && (
          <p className="text-sm text-muted" aria-live="polite">
            Showing {(meta.page - 1) * meta.limit + 1} to {(meta.page - 1) * meta.limit + list.length} of {meta.total}
          </p>
        )}
      </div>

      {/* ===== 3. ENTRY LIST: loading, error, empty and the cards ===== */}

      {/* 3a. The request failed: message with "Try again". */}
      {entries.status === "error" && <ErrorState title="Could not load the entries" error={entries.error} onRetry={entries.reload} />}

      {/* 3b. First load, nothing to show yet: skeleton cards. */}
      {entries.status === "loading" && list === undefined && <EntryListSkeleton />}

      {/* 3c. We have a list. While the next page loads it stays on screen, dimmed (aria-busy). */}
      {list && meta && (
        <div aria-busy={shown.isPlaceholder} className={shown.isPlaceholder ? "opacity-60 transition-opacity" : undefined}>
          {list.length === 0 ? (
            // 3c-i. Empty: out-of-range page, filters that match nothing, or a section with no entries.
            <p className="text-muted">
              {meta.page > 1 && meta.total > 0 ? (
                <>
                  There is no page {meta.page}.{" "}
                  <Link to={to({ page: 1 })} preventScrollReset className="text-accent underline">
                    Go to the first page
                  </Link>
                  .
                </>
              ) : filtered ? (
                <>
                  No entries match these filters.{" "}
                  <Link to={to({ difficulty: undefined, search: "" })} preventScrollReset className="text-accent underline">
                    Clear the filters
                  </Link>
                </>
              ) : (
                "This section has no published entries yet."
              )}
            </p>
          ) : (
            // 3c-ii. The cards: one EntryRow per entry (a link to the entry page).
            <ul className="space-y-3">
              {list.map((entry) => (
                <EntryRow key={entry.slug} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ===== 4. PAGER: Previous, page numbers, Next (real links, so Back and "open in new tab" work) ===== */}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} to={pageLink} />}
    </div>
  );
}
