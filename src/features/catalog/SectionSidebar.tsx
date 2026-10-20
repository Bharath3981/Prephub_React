import { Link, useParams } from "react-router";
import type { EntryGroup } from "@/features/catalog/group-entries";
import type { DeliverySection } from "@/features/catalog/types";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  sections: DeliverySection[];
  /** null while the entries are still loading. */
  groups: EntryGroup[] | null;
}

/** Left column: the other sections of this topic, and the headings of this section (links that jump down the page). */
export function SectionSidebar({ sections, groups }: Props) {
  // The URL already says which topic and section are open, so read it here instead of passing it down.
  const { category: categorySlug = "", section: activeSectionSlug = "" } = useParams();
  return (
    <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
      <nav aria-label="Sections of this topic">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Sections</h2>
        <ul className="space-y-1">
          {sections.map((section) => {
            const active = section.slug === activeSectionSlug;
            return (
              <li key={section.slug}>
                <Link
                  to={`/${categorySlug}/${section.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn("block rounded-md px-3 py-1.5 text-sm", active ? "bg-accent-soft font-medium text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-foreground")}
                >
                  {section.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav aria-label="On this page">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">On this page</h2>
        {groups === null ? (
          <div className="space-y-2" role="status" aria-busy="true">
            <span className="sr-only">Loading headings...</span>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-3/4" />
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {groups.map((group) => (
              <li key={group.id}>
                <a href={`#${group.id}`} className="flex items-baseline justify-between gap-2 rounded-md px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-foreground">
                  <span>{group.title}</span>
                  <span className="text-xs">{group.entries.length}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
