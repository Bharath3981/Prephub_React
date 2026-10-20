import { Outlet, useParams } from "react-router";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { getCategory, getEntries } from "@/features/catalog/api";
import { navGroups } from "@/features/catalog/group-entries";
import { SectionNavDesktop, SectionNavMobile, SectionNavSkeleton } from "@/features/catalog/SectionNav";
import type { DeliveryCategoryDetail, DeliverySection } from "@/features/catalog/types";
import { isNotFound } from "@/shared/api/not-found";
import { useRenderCount } from "@/shared/dev/render-count";
import { useFetch } from "@/shared/hooks/useFetch";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Skeleton } from "@/shared/ui/Skeleton";

/** What the layout hands to the page inside it (read with useOutletContext), so the page does not fetch the same topic again. */
export interface SectionContext {
  category: DeliveryCategoryDetail;
  section: DeliverySection;
}

/**
 * The frame shared by a section's list page and all of its entries: the side panel plus the page beside it.
 * It is a layout ROUTE on purpose: it stays mounted while the visitor moves between the entries of one section, so the
 * panel is not rebuilt (no flash, and its scroll position survives). Only the <Outlet /> changes.
 */
export function SectionLayout() {
  useRenderCount("SectionLayout");
  const { category: categorySlug = "", section: sectionSlug = "" } = useParams();
  const category = useFetch((signal) => getCategory(categorySlug, signal), [categorySlug]);
  // All entries (the API allows 100 at most) for the panel; the list page asks for its own page separately.
  const all = useFetch((signal) => getEntries(categorySlug, sectionSlug, { limit: 100 }, signal), [categorySlug, sectionSlug]);

  if (isNotFound(category)) return <NotFoundPage />;
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

  // A section with a single entry has nothing to navigate. The panel is a convenience: if its request fails, the page still works.
  const groups = all.status === "success" && all.data.entries.length >= 2 ? navGroups(all.data.entries) : null;
  const showNav = all.status === "loading" || groups !== null;
  const nav = { category: category.data.slug, section: section.slug, sectionName: section.name };
  const context: SectionContext = { category: category.data, section };

  return (
    <div className={showNav ? "lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10" : undefined}>
      {showNav && (
        <>
          <aside className="hidden lg:block">{groups ? <SectionNavDesktop {...nav} groups={groups} /> : <SectionNavSkeleton />}</aside>
          {groups && <SectionNavMobile {...nav} groups={groups} />}
        </>
      )}
      <div className="min-w-0">
        <Outlet context={context} />
      </div>
    </div>
  );
}
