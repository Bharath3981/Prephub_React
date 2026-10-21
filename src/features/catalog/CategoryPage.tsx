import { useParams } from "react-router";
import { getCategory } from "@/features/catalog/api";
import { SectionCard } from "@/features/catalog/SectionCard";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { ApiRequestError } from "@/shared/api/client";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Skeleton } from "@/shared/ui/Skeleton";

function CategoryPageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading the topic...</span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <li key={i} className="space-y-3 rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryPage() {
  useRenderCount("CategoryPage");
  // The URL decides what to load. When it changes (/react to /javascript) the same component is reused with a new slug,
  // so the slug is a dependency of useFetch: the old request is cancelled and a new one starts.
  const { category: slug = "" } = useParams();
  const result = useFetch((signal) => getCategory(slug, signal), [slug]);
  const notFound = result.status === "error" && result.error instanceof ApiRequestError && result.error.status === 404;
  useDocumentTitle(notFound ? "Page not found" : result.status === "success" ? result.data.name : undefined);

  // The API answers 404 for an unknown slug: show the "not found" page, not a generic error.
  if (notFound) return <NotFoundPage />;
  if (result.status === "loading") return <CategoryPageSkeleton />;
  if (result.status === "error") return <ErrorState title="Could not load this topic" error={result.error} onRetry={result.reload} />;

  const category = result.data;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: category.name }]} />
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && <p className="max-w-2xl text-muted">{category.description}</p>}
      </header>

      <section aria-labelledby="sections-heading">
        <h2 id="sections-heading" className="sr-only">
          Sections of {category.name}
        </h2>
        {category.sections.length === 0 ? (
          <p className="text-muted">This topic has no published sections yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {category.sections.map((section) => (
              <SectionCard key={section.slug} categorySlug={category.slug} section={section} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
