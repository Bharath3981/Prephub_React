import { useParams } from "react-router";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { getCategory, getEntries } from "@/features/catalog/api";
import { EntryRow } from "@/features/catalog/EntryRow";
import { groupEntries } from "@/features/catalog/group-entries";
import { SectionSidebar } from "@/features/catalog/SectionSidebar";
import { ApiRequestError } from "@/shared/api/client";
import { useRenderCount } from "@/shared/dev/render-count";
import { useFetch, type FetchState } from "@/shared/hooks/useFetch";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ErrorState } from "@/shared/ui/ErrorState";
import { KindBadge } from "@/shared/ui/KindBadge";
import { Skeleton } from "@/shared/ui/Skeleton";

const isNotFound = (state: FetchState<unknown>) => state.status === "error" && state.error instanceof ApiRequestError && state.error.status === 404;

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
  const { category: categorySlug = "", section: sectionSlug = "" } = useParams();

  // Two independent requests that run at the same time: the topic (its sections, for the header and sidebar) and the entries.
  const category = useFetch((signal) => getCategory(categorySlug, signal), [categorySlug]);
  const entries = useFetch((signal) => getEntries(categorySlug, sectionSlug, { limit: 100 }, signal), [categorySlug, sectionSlug]);

  if (isNotFound(category) || isNotFound(entries)) return <NotFoundPage />;
  if (category.status === "error") return <ErrorState title="Could not load this topic" error={category.error} onRetry={category.reload} />;
  if (category.status === "loading") {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading the section...</span>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  const section = category.data.sections.find((s) => s.slug === sectionSlug);
  if (!section) return <NotFoundPage />; // the topic exists but has no such section

  const groups = entries.status === "success" ? groupEntries(entries.data.entries) : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: category.data.name, to: `/${category.data.slug}` }, { label: section.name }]} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{section.name}</h1>
          <KindBadge kind={section.kind} />
        </div>
        {section.description && <p className="max-w-2xl text-muted">{section.description}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <SectionSidebar sections={category.data.sections} groups={groups} />

        <div className="space-y-8">
          {entries.status === "loading" && <EntryListSkeleton />}
          {entries.status === "error" && <ErrorState title="Could not load the entries" error={entries.error} onRetry={entries.reload} />}
          {entries.status === "success" && groups !== null && (
            <>
              {groups.length === 0 && <p className="text-muted">This section has no published entries yet.</p>}
              {groups.map((group) => (
                <section key={group.id} aria-labelledby={group.id}>
                  <h2 id={group.id} className="mb-3 scroll-mt-20 text-xl font-semibold">
                    {group.title}
                  </h2>
                  <ul className="space-y-3">
                    {group.entries.map((entry) => (
                      <EntryRow key={entry.slug} entry={entry} />
                    ))}
                  </ul>
                </section>
              ))}
              {entries.data.meta.total > entries.data.entries.length && (
                <p className="text-sm text-muted">
                  Showing {entries.data.entries.length} of {entries.data.meta.total} entries. Pages come in step 2.5.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
