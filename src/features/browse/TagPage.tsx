import { useCallback } from "react";
import { useParams } from "react-router";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { getTag } from "@/features/catalog/api";
import { EntryResults } from "@/features/catalog/EntryResults";
import { PAGE_SIZE, useListParams } from "@/features/catalog/list-params";
import { isNotFound } from "@/shared/api/not-found";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { mapFetchState, useFetch } from "@/shared/hooks/useFetch";
import { useKeepPrevious } from "@/shared/hooks/useKeepPrevious";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";

/**
 * TAG PAGE: /tags/:tag. One tag and the entries that use it, one page at a time.
 * An unknown tag makes the API answer 404, and we show the not-found page. The API ignores difficulty on this
 * endpoint, so there are no filters here, only the pager.
 */
export function TagPage() {
  useRenderCount("TagPage");
  const slug = useParams().tag ?? "";

  const { page, to } = useListParams();
  const pageLink = useCallback((next: number) => to({ page: next }), [to]);

  const result = useFetch((signal) => getTag(slug, { page, limit: PAGE_SIZE }, signal), [slug, page]);
  // The header keeps showing this tag while its next page loads.
  const tag = useKeepPrevious(result, `tag/${slug}`).data?.tag;
  const missing = isNotFound(result);

  useDocumentTitle(missing ? "Page not found" : tag ? `#${tag.name}` : "Tag");
  if (missing) return <NotFoundPage />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Tags", to: "/tags" }, { label: tag ? `#${tag.name}` : "..." }]} />
        <h1 className="text-3xl font-bold tracking-tight">{tag ? `#${tag.name}` : "Tag"}</h1>
        {tag && (
          <p className="text-muted">
            {tag.entryCount} {tag.entryCount === 1 ? "entry" : "entries"} use this tag.
          </p>
        )}
      </header>

      <EntryResults
        entries={mapFetchState(result, (data) => data.entries)}
        scope={`tag/${slug}`}
        pageLink={pageLink}
        emptyText="No published entries use this tag."
        topicName={undefined}
      />
    </div>
  );
}
