import { useCallback } from "react";
import { getTags } from "@/features/catalog/api";
import { useListParams } from "@/features/catalog/list-params";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { useKeepPrevious } from "@/shared/hooks/useKeepPrevious";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { TagChip } from "@/shared/ui/TagChip";

/** The API sends at most 100 tags per page (and there are hundreds), so this page has a pager too. */
const TAGS_PER_PAGE = 100;

/** TAGS PAGE: /tags. Every tag with how many entries use it, most used first. */
export function TagsPage() {
  useRenderCount("TagsPage");
  useDocumentTitle("Tags");

  const { page, to } = useListParams();
  const pageLink = useCallback((next: number) => to({ page: next }), [to]);

  const tags = useFetch((signal) => getTags({ page, limit: TAGS_PER_PAGE }, signal), [page]);
  const shown = useKeepPrevious(tags, "tags");
  const data = shown.data;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Tags" }]} />
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="max-w-2xl text-muted">{data ? `${data.meta.total} tags, most used first.` : "Every tag, most used first."} Pick one to see its entries.</p>
      </header>

      {tags.status === "error" && <ErrorState title="Could not load the tags" error={tags.error} onRetry={tags.reload} />}

      {tags.status === "loading" && !data && (
        <div role="status" aria-busy="true" className="flex flex-wrap gap-2">
          <span className="sr-only">Loading tags...</span>
          {Array.from({ length: 24 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-full" />
          ))}
        </div>
      )}

      {data && (
        <ul aria-busy={shown.isPlaceholder} className={shown.isPlaceholder ? "flex flex-wrap gap-2 opacity-60 transition-opacity" : "flex flex-wrap gap-2"}>
          {data.tags.map((tag) => (
            <li key={tag.slug}>
              <TagChip tag={tag} count={tag.entryCount} />
            </li>
          ))}
        </ul>
      )}

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} to={pageLink} />}
    </div>
  );
}
