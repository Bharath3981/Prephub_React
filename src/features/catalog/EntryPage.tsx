import { useOutletContext, useParams } from "react-router";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { getEntry } from "@/features/catalog/api";
import { EntryPager } from "@/features/catalog/EntryPager";
import type { SectionContext } from "@/features/catalog/SectionLayout";
import { isNotFound } from "@/shared/api/not-found";
import { useRenderCount } from "@/shared/dev/render-count";
import { useFetch } from "@/shared/hooks/useFetch";
import { Badge } from "@/shared/ui/Badge";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { ErrorState } from "@/shared/ui/ErrorState";
import { KindBadge } from "@/shared/ui/KindBadge";
import { Skeleton } from "@/shared/ui/Skeleton";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

function EntryPageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Loading the entry...</span>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-5 w-32 rounded-full" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

/**
 * ENTRY PAGE: /:category/:section/:entry, for example /react/interview-questions/react-fiber-architecture
 *
 * Like SectionPage, this file is only the right-hand part of the screen: the side panel comes from SectionLayout and
 * stays mounted while you move from entry to entry.
 *
 *   1. HEADER   breadcrumbs, kind and difficulty, title, reading time and date, tags
 *   2. SUMMARY  the short answer
 *   3. BODY     the full answer (step 3.2)
 *   4. PAGER    previous and next entry, in the order of the side panel
 */
export function EntryPage() {
  useRenderCount("EntryPage");
  const { category, section, entryOrder } = useOutletContext<SectionContext>();
  const { entry: slug = "" } = useParams();

  const result = useFetch((signal) => getEntry(category.slug, section.slug, slug, signal), [category.slug, section.slug, slug]);

  if (isNotFound(result)) return <NotFoundPage />;
  if (result.status === "error") return <ErrorState title="Could not load this entry" error={result.error} onRetry={result.reload} />;
  if (result.status === "loading") return <EntryPageSkeleton />;

  const entry = result.data;
  const updated = new Date(entry.updatedAt);

  return (
    <article className="space-y-6">
      {/* ===== 1. HEADER ===== */}
      <header className="space-y-3">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: category.name, to: `/${category.slug}` }, { label: section.name, to: `/${category.slug}/${section.slug}` }, { label: entry.title }]} />
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={entry.kind} />
          {entry.difficulty && <DifficultyBadge difficulty={entry.difficulty} />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
        <p className="text-sm text-muted">
          {entry.meta.readingMinutes !== undefined && <>{entry.meta.readingMinutes} min read · </>}
          Updated <time dateTime={entry.updatedAt}>{dateFormat.format(updated)}</time>
        </p>
        {entry.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {entry.tags.map((tag) => (
              <li key={tag.slug}>
                <Badge>{tag.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* ===== 2. SUMMARY ===== */}
      {entry.summary && <p className="max-w-3xl text-lg text-muted">{entry.summary}</p>}

      {/* ===== 3. BODY: rendered safely in step 3.2 ===== */}
      <Badge tone="warning">The full answer arrives in step 3.2</Badge>

      {/* ===== 4. PAGER ===== */}
      <EntryPager categorySlug={category.slug} sectionSlug={section.slug} order={entryOrder} current={entry.slug} />
    </article>
  );
}
