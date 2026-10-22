import { useCallback, useMemo } from "react";
import { MIN_SEARCH_LENGTH, getCategories, searchEntries } from "@/features/catalog/api";
import { EntryFilters } from "@/features/catalog/EntryFilters";
import { EntryResults } from "@/features/catalog/EntryResults";
import { PAGE_SIZE, useListParams } from "@/features/catalog/list-params";
import type { EntriesPage } from "@/features/catalog/types";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";

const NOTHING: EntriesPage = { entries: [], meta: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 } };

/**
 * SEARCH PAGE: /search?search=closure&page=2
 * The same list machinery as the Questions page (URL state, debounced box, EntryResults), without the topic and difficulty filters (the search endpoint has none), but the request is the
 * full-text search: best match first, over every kind of entry, with a snippet that highlights the match.
 * The API needs at least 2 characters; with less we ask nothing and show a hint.
 */
export function SearchPage() {
  useRenderCount("SearchPage");

  const { page, search, to, change } = useListParams();
  const q = search.trim();
  const ready = q.length >= MIN_SEARCH_LENGTH;
  useDocumentTitle(q ? `Search: ${q}` : "Search");

  const pageLink = useCallback((next: number) => to({ page: next }), [to]);

  // Topic names for the label on each card (the search answer only has the topic's slug).
  const topics = useFetch((signal) => getCategories(signal), []);
  const topicList = useMemo(() => (topics.status === "success" ? topics.data : []), [topics]);
  const topicName = useCallback((slug: string) => topicList.find((topic) => topic.slug === slug)?.name, [topicList]);

  const entries = useFetch((signal) => (ready ? searchEntries({ q, page, limit: PAGE_SIZE }, signal) : Promise.resolve(NOTHING)), [ready, q, page]);

  const hint = !q ? "Type something to search, for example closure or useEffect." : ready ? `Nothing found for "${q}".` : `Type at least ${MIN_SEARCH_LENGTH} characters.`;

  const filters = <EntryFilters difficulty={undefined} search={search} searchLabel="Search everything" onSearch={(value) => change({ search: value }, { replace: true })} />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Search" }]} />
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="max-w-2xl text-muted">Search every question, concept and example. Best matches come first.</p>
      </header>

      {/* Always the same tree, so the search box keeps its text and focus when the query becomes long enough. */}
      <EntryResults
        entries={entries}
        scope={`search/${q}`}
        pageLink={pageLink}
        emptyText={hint}
        topicName={topicName}
        filters={filters}
      />
    </div>
  );
}
