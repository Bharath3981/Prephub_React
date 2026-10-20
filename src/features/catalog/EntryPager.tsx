import { Link } from "react-router";
import type { NavItem } from "@/features/catalog/group-entries";
import { cn } from "@/shared/lib/cn";

const card = "block rounded-xl border border-border bg-surface p-4 hover:border-accent";

/**
 * "Previous" and "Next" at the end of an entry, in the same order as the side panel (group by group), so a section can be
 * read from the first entry to the last. Shows nothing when the order is unknown or the entry is the only one.
 */
export function EntryPager({ categorySlug, sectionSlug, order, current }: { categorySlug: string; sectionSlug: string; order: NavItem[] | null; current: string }) {
  if (!order) return null;
  const index = order.findIndex((item) => item.slug === current);
  if (index === -1) return null;
  const previous = order[index - 1];
  const next = order[index + 1];
  if (!previous && !next) return null;

  return (
    <nav aria-label="Previous and next" className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {previous ? (
        <Link to={`/${categorySlug}/${sectionSlug}/${previous.slug}`} className={card}>
          <span className="text-xs text-muted">← Previous</span>
          <span className="mt-1 block font-medium">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={`/${categorySlug}/${sectionSlug}/${next.slug}`} className={cn(card, "sm:text-right")}>
          <span className="text-xs text-muted">Next →</span>
          <span className="mt-1 block font-medium">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
