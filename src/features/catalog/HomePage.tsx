import { getCategories } from "@/features/catalog/api";
import { CategoryCard } from "@/features/catalog/CategoryCard";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Skeleton } from "@/shared/ui/Skeleton";

function CategoryGridSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading topics...</span>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="space-y-3 rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomePage() {
  useRenderCount("HomePage");
  useDocumentTitle();
  const categories = useFetch(getCategories, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Interview preparation, one concept at a time</h1>
        <p className="mt-2 max-w-2xl text-muted">Pick a topic to read concepts, practise interview questions and see real examples.</p>
      </section>

      <section aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="text-xl font-semibold">
          Topics
        </h2>
        <div className="mt-4">
          {categories.status === "loading" && <CategoryGridSkeleton />}

          {categories.status === "error" && <ErrorState title="Could not load the topics" error={categories.error} onRetry={categories.reload} />}

          {categories.status === "success" &&
            (categories.data.length === 0 ? (
              <p className="text-muted">No topics have been published yet.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.data.map((category) => (
                  <CategoryCard key={category.slug} category={category} />
                ))}
              </ul>
            ))}
        </div>
      </section>
    </div>
  );
}
